const path = require("path").posix;
const ProgressBarPlugin = require("progress-bar-webpack-plugin");

module.exports = {
    entry: ["babel-polyfill", "./views/index.jsx"],
    output: {
        path: path.resolve(__dirname, "./public/js"),
        filename: "bundle.js",
        publicPath: "/js"
    },
    module: {
        rules: [
            {
                test: /\.js$|\.jsx$/,
                exclude: /node_modules/,
                use: [{
                    loader: "babel-loader",
                    options: {
                        presets: ["env", "react"],
                        plugins: ["transform-object-rest-spread"]
                    }
                }]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.svg$|\.woff$|\.woff2$|\.[ot]tf$|\.eot$|\.png$/,
                loader: "url-loader"
            }
        ]
    },
    plugins: [
        new ProgressBarPlugin()
    ],
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    }
};