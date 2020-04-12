# IdleHeroes
Accessory code and resources for Idle Heroes

## Monopoly

A new gameplay introduced during Easter 2020.

`./src/Monopoly/java/Monopoly.java` contains initial implementation of the simulation that was addressing statistical characteristics of
the game and aimed to find and prove the best strategy. Initial effort was done by [/u/SavageCorgi](https://reddit.com/u/SavageCorgi) in
[this pastebin](https://pastebin.com/wkTEUva4)

Code is not structured properly as it was run in [https://www.jdoodle.com/online-java-compiler/](https://www.jdoodle.com/online-java-compiler/)

## Calculate statistics with the best strategy

JS version of the project was made in Visual Studio Code. If you have Node.js and VSC installed open the project select "Simulate 100k runs..." debug configuration and press F5.

But you can run without VSC. Make sure Node.js is intalled on your system

In the folder of project run
(if Node version is below 13)
```
node --experimental-modules ./docs/js/monopoly.mjs
```

(if Node version is 13+, omit the experimental flag)
```
node ./docs/js/monopoly.mjs
```

### Selecting strategies
If you feel adventurous you can choose a different strategy passed as a parameter to `.play()` method in `monopoly.mjs:35`

If you feel creative you can update/create new strategies in `MonopolyEngine.mjs`

## Running online simulator locally

Because this code structure utilizes latest ES6 modules to be able to run code in both brwoser and Node.js without modification, you will need a webserver
to run the simulator locally.

Before launching make sure to install packages running `npm install` in the folder of the project.

If you're using VSC you can just select 'Local simulator' debug configuration.

If you only have Node.js installed run
```
	node --experimental-modules ./docs/js/server.js
```

If successded the simulator will be accessible by `http://localhost:8080` in browser.