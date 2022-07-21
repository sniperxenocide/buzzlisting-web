// This is the location where the file is placed
let dest = 'workflow/bpmn/js/';

// The file name which need to compiled.
// The compiled version will be in static/assets/js/filename.js
let file_name = 'design';

module.exports = {
    // This is the "main" file which should include all other modules
    entry: './static/' + dest + file_name + '.js',
    // Where should the compiled file go?
    output: {
        // To the `dist` folder
        path: './static/assets/js/',
        // With the filename `build.js` so it's dist/build.js
        filename: file_name + '.js'
    },
    module: {
        // Special compilation rules
        loaders: [
            {
                // Ask webpack to check: If this file ends with .js, then apply some transforms
                test: /\.js$/,
                // Transform it with babel
                loader: 'babel-loader',
                // don't transform node_modules folder (which don't need to be compiled)
                exclude: /node_modules/
            },
            {
                test: /\.vue$/,
                loader: 'vue'
            }
        ]
    },
    vue: {
        loaders: {
            js: 'babel-loader'
        }
    },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.common.js'
        },
        extensions: ['', '.js', '.coffee']
    }
};