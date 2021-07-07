const express = require("express");
let fs = require("fs")
let bodyParser = require("body-parser");
let weather = require('weather-js');

const TelegramBot = require('node-telegram-bot-api');
const e = require("express");

const token = '1894805608:AAH0B3xHo-llC87TzRSEu83t-Rru4bZ8l9o';

const bot = new TelegramBot(token, { polling: true });

let app = express();


app.set("view engine", "ejs");

const filePath = "./db/users.txt"

app.use(bodyParser.json());         // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

const checkUnique = (chatId) => {
    if (fs.existsSync(filePath)) {
        let users = JSON.parse(fs.readFileSync(filePath))
        let unique = true

        for (let i = 0; i < users.length; i++) {
            if (users[i].chatId === chatId) {
                unique = false;
                break
            }
        }
        return unique
    }
}


const saveUser = (username, chatId) => {
    let user = {
        username: username,
        chatId: chatId
    }

    if (checkUnique(chatId)) {

        let users = null
        try {
            users = JSON.parse(fs.readFileSync(filePath))
            console.log(users)

        } catch {
            users = []
        }


        users.push(user)
        fs.writeFileSync(filePath, JSON.stringify(users))

        bot.sendMessage(chatId, "Вы зарегистрировались успешно, сэр")
    } else {
        bot.sendMessage(chatId, "Бро ты зарегистрирован че мутишь")
    }
}

app.get("/contacts", function (request, response) {
    response.render("contacts.ejs", {
        title: "Страница контактов",
        contacts: JSON.parse(fs.readFileSync(filePath))
    })
})

app.post("/bot/message", function (request, response) {
    let chatId = request.body.chatId
    let message = request.body.message
    bot.sendMessage(chatId, message)
})

bot.onText(/\/register/, function (msg, match) {
    let textArray = msg.text.split(" ")
    textArray.splice(0, 1);
    let textWithoutCommand = textArray.join(" ")
    bot.sendMessage(msg.chat.id, "Вы зарегистрировались под именем " + "" + textWithoutCommand)
    saveUser(textWithoutCommand, msg.chat.id)
})

bot.onText(/\/weather/, function (msg, match) {
    let city = msg.text.split(" ")[1]
    let register = false

    let chatId = msg.chat.id;

    let users = JSON.parse(fs.readFileSync(filePath));

    for (let i = 0; i < users.length; i++) {
        if (users[i].chatId === chatId) {
            register = true
            break
        }
    }

    if (register) {
        weather.find({ search: city, degreeType: 'C' }, function (err, result) {
            if (err) console.log(err);

            bot.sendMessage(msg.chat.id, "Погода в городе " + city + " " + result[0]['current']['temperature'] + "" + result[0]['location']['degreetype'])

            let newWeather = {
                chatId: msg.chat.id,
                weatherSearch: "Погода в городе " + city + " " + result[0]['current']['temperature'] + "" + result[0]['location']['degreetype']
            }

            try {
                allWeather = JSON.parse(fs.readFileSync("./db/history.txt"))
            } catch {
                allWeather = []
            }

            allWeather.push(newWeather)
            fs.writeFileSync("./db/history.txt", JSON.stringify(allWeather))
        })
    } else {
        bot.sendMessage(msg.chat.id, "Зарегистрируйтесь!")
    }
})

app.get("/history", function (request, response) {
    response.render("history.ejs", {
        title: "Страница истории поика",
        allWeather: JSON.parse(fs.readFileSync("./db/history.txt"))
    })
})

app.get("/distribution", function (request, response) {
    response.render("distribution.ejs", {
        title: "Страница рассылки"
    })
})

app.post("/message", function (request, response) {
    users = JSON.parse(fs.readFileSync(filePath))
    let allMessage = request.body.allMessage
    for (let i = 0; i < users.length; i++) {
        bot.sendMessage(users[i]['chatId'], allMessage)
    }
})


bot.onText(/\/search/, function (msg, match) {
    let textArray = msg.text.split(" ")
    textArray.splice(0, 1);
    let artistName = textArray.join(" ")


    let axios = require("axios").default;

    let options = {
        method: 'GET',
        url: 'https://genius.p.rapidapi.com/search',
        params: { q: `${artistName}` },
        headers: {
            'x-rapidapi-key': '999b8ecad6msh574a4ba6e27ee35p1fea3djsn5240d8868fa9',
            'x-rapidapi-host': 'genius.p.rapidapi.com'
        }
    };

    axios.request(options).then(function (response) {
        bot.sendMessage(msg.chat.id, JSON.stringify(response.data.hits));
    }).catch(function (error) {
        bot.sendMessage(error);
    });
})


let port = process.env.PORT === undefined? 3030 : process.env.PORT;

app.lsten(port);
