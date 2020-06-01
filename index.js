const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const moment = require("moment");
var cors = require("cors");
app.use(cors());
var http = require("http").createServer(app);
var io = require("socket.io")(http);

app.set("view engine", "pug");
app.set("views", "./views");
//fix lỗi CORS
app.all("/gets", function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

io.on("connection", (socket) => {
	console.log(socket.id + "da ket noi");
	socket.on("disconnect", function () {
		console.log(socket.id + ": disconnected");
	});

	socket.on("Client-send-data", () => {
		increaseStar();
		console.log(socket.id, "da gui Client-send-data");
		io.sockets.emit("Server-send-data");
	});
});

mongoose.connect("mongodb://localhost:27017/doAn", {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const datesSchema = new mongoose.Schema({
	date: String,
	infor: Array,
});

const Dates = mongoose.model("Dates", datesSchema, "dates");

app.get("/", async (req, res) => {
	const dates = await Dates.find();
	// dates.reverse();
	res.json(dates);
});

app.get("/gets", async (req, res) => {
	const { _limit, _page } = req.query;
	const dates = await Dates.find();
	dates.reverse();
	const thisDate = dates.slice((_page - 1) * _limit, _page * _limit);
	res.json(thisDate);
});

app.get("/increase", (req, res) => {
	res.render("layout.pug");
});

app.get("/star/increase", async (req, res) => {
	increaseStar();
	res.redirect("/");
});

app.post("/star/increase", async (req, res) => {
	increaseStar();
	res.redirect("/");
});

http.listen(port, () =>
	console.log(`Example app listening at http://localhost:${port}`)
);

let increaseStar = async (req, res, next) => {
	let date = new Date();
	let thisDay = await Dates.findOne({ date: moment().format("l") });
	let count;
	if (!thisDay) {
		Dates.create({
			date: moment().format("l"),
			infor: [
				{ shape: "Star", count: 1 },
				{ shape: "Square", count: 0 },
				{ shape: "Circle", count: 0 },
			],
		});
	} else {
		count = thisDay.infor[0].count;
		let newInfor = thisDay.infor;
		for (let item of newInfor) {
			if (item.shape === "Star") {
				item.count = count + 1;
			}
		}
		await Dates.findOneAndUpdate({ date: thisDay.date }, { infor: newInfor });
	}
};
