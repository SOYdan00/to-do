import fs from "node:fs";
import express from "express";
import { PrismaClient } from "@prisma/client";
import escapeHTML from "escape-html";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));
const prisma = new PrismaClient();

const template = fs.readFileSync("./template.html", "utf-8");
app.get("/", async (request, response) => {
  const todos = await prisma.todo.findMany();
  const html = template.replace(
    "<!-- todos -->",
    todos
      .sort((a) => a.done)
      // .sort((a, b) => (a.updated - b.updated || !a.done ? 1 : -1))
      .map(
        (todo) => `
          <li>
            <form action="/edit" method="post">
              <input type="hidden" name="id" value="${todo.id}" />
              <input type="checkbox" name="done" ${
                todo.done ? "checked " : ""
              }/>
              <input type="string" name="title" value="${escapeHTML(
                todo.title
              )}" />
              <button type="submit">登録</button>
            </form>
            <form action="/delete" method="post">
              <input type="hidden" name="id" value="${todo.id}" />
              <input type="submit" value="削除" />
            </form>
          </li>
        `
      )
      .join("")
  );
  response.send(html);
});

app.post("/create", async (request, response) => {
  await prisma.todo.create({
    data: { title: request.body.title, done: request.body.done === "on" },
  });
  response.redirect("/");
});

app.post("/delete", async (request, response) => {
  await prisma.todo.delete({
    where: { id: parseInt(request.body.id) },
  });
  response.redirect("/");
});

app.post("/edit", async (request, response) => {
  await prisma.todo.update({
    where: { id: parseInt(request.body.id) },
    data: {
      title: request.body.title,
      done: request.body.done === "on",
    },
  });
  response.redirect("/");
});

app.listen(3000);
