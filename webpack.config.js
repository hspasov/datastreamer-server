const path = require("path").posix;

module.exports = {
    entry: "./views/index.js",
    output: {
        path: path.resolve(__dirname, "./public/js"),
        filename: "bundle.js",
        publicPath: "/js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
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

    ],
    watch: true,
    watchOptions: {
        ignored: /node_modules/
    }
};