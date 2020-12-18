const socket = io();

//Elements

const $messageForm = document.querySelector("#message-form"); //message form
const $messageFormInput = $messageForm.querySelector("input"); //message input
const $messageFormButton = $messageForm.querySelector("button"); //message sending button
const $locationButton = document.querySelector("#my-location"); //location sending button
const $messages = document.querySelector("#messages"); // showing message at here

//Templates
const $locationTemplate = document.querySelector("#location-template").innerHTML //locastion tamplete
const $messagesTemplate = document.querySelector("#message-template").innerHTML //message tamplate
const $sidebarTemplate = document.querySelector("#sidebar-template").innerHTML //message tamplate

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //heightof the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visivleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrolloffset = $messages.scrollTop + visivleHeight

    if (containerHeight - newMessageHeight <= scrolloffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

//receiving message
socket.on("message", (message) => {
    console.log(message);

    const html = Mustache.render($messagesTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a"),
        username: message.username
    })
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html;
})


//sending Message
$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute("disabled", "disabled")

    const message = e.target.elements.message.value;
    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if (error) {
            return console.log(error);
        }
        console.log("Message is delivered!")
    });
})




//location
$locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported to your browser.")
    }

    $locationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        },
            () => {
                console.log("Location shared");
            })
    })

    $locationButton.removeAttribute("disabled");

})

//receiving location url

socket.on("locationMessage", (url) => {
    console.log(url)

    const html = Mustache.render($locationTemplate, {
        url: url.text,
        createdAt: moment(url.createdAt).format("h:mm a"),
        username: url.username
    })

    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
})


socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/"
    }
})


