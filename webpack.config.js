const path = require("path");

module.exports = {
    entry: "./views/index.js",
    output: {
        path: path.resolve(__dirname, "./public/js"),
        filename: "bundle.js",
        publicPath: "/js"
    },
    module: {
        rules: [{
            test: /\.js$/,
            use: [{
                loader: "babel-loader",
                options: {
                    presets: ["env", "react"]
                }
            }]
        }]
    },
    plugins: [

    ]
};