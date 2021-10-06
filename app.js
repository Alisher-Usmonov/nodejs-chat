const express = require("express");
const path = require("path");
const CookieParser = require("cookie-parser");
const env = require("./config");
const fs = require("fs/promises");
const { v4: uuidv4 } = require('uuid');

// create an express application
const app = express();

// app settings
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "pages"))

// app middlewares;
app.use(CookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/styles", express.static(path.join(__dirname, "pages", "styles")))
app.get("/", (req, res) => {
    const { name } = req.cookies;
    if(!name) {
        res.redirect("/login")
        return;
    }
    res.redirect("/chat");
})
app.get("/login", (req, res) => {
    res.render("login", {});
})
app.post("/login", async (req, res) => {
    let { name } = req.body;
    console.log(name);
    const dbPath = path.join(__dirname, "database.json");
    let db = await fs.readFile(dbPath, "utf-8");
    db = await JSON.parse(db);
    let findName = db.users.find(user => user.name.toLowerCase() === name.toLowerCase())
    
    if(!findName) {
        db.users.push({
            name,
            id: uuidv4()
        })
    }
    await fs.writeFile(dbPath, JSON.stringify(db));
    res.cookie("name", name).redirect("/");
})

app.get("/chat", async (req, res) => {
    const { name } = req.cookies;
    let db = await fs.readFile(path.join(__dirname, "database.json"), "utf-8");
    db = JSON.parse(db);
    res.render("chat", {
        db,
        me: name
    });
})

app.post("/chat", async (req, res) => {
    
    let { text } = req.body;
    let { name } = req.cookies;
    let db = await fs.readFile(path.join(__dirname, "database.json"), "utf-8");
    db = JSON.parse(db);
    let user_id = db.users.filter(user => user.name === name);
    console.log(user_id);
    db.messages.push({
        id: uuidv4(),
        text,
        user_id: user_id[0].id
    })
    await fs.writeFile(path.join(__dirname, "database.json"), JSON.stringify(db));
    res.redirect(req.url);
})

app.get('/leave', (req, res) => {
    res.clearCookie("name").redirect("/login");
})

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`)
})