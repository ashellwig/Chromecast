/**
 * Gulp tasks.
 */

'use strict';

let app = (path) => {
    return './app/' + (path || '');
};

let src = (path) => {
    return './jsx/' + (path || '');
};

let vendor = (path) => {
    return './node_modules/' + (path || '');
};

const
    gulp = require('gulp'),
    concat = require('gulp-concat'),
    babel = require('gulp-babel'),
    eslint = require('gulp-eslint'),
    packager = require('electron-packager'),
    // packBackend = require('./webpack.backend.js'),
    packDir = require('pack-dir'),
    // webpack = require('webpack'),

    paths = {
        desktopApp: './build',
        css: app('css/'),
        js: app('js/'),
        src: '',
        srcBackend: [
            app('*.js'),
            'gulpfile.js'
        ],
        srcFiles: [
            src('components/*.jsx'),
            src('index.jsx')
        ],
        reloadOn: [
            app('css/*.css'),
            app('js/*.js'),
            app('main*.js'),
            app('index.html')
        ]
    };

let getPackagerParams = (platform) => {
    let pkg = require(app('package.json')),
        params = {
            arch: 'all',
            asar: true,
            dir: app(),
            icon: app('img/icon512'),
            name: pkg.productName,
            out: paths.desktopApp,
            overwrite: true,
            platform: platform,
            prune: true,
            version: pkg.electronVersion,
            'app-version': pkg.version,
            'app-copyright': pkg.author,
            'build-version': pkg.version
        };

    if (platform === 'darwin') {
        params['app-category-type'] = 'public.app-category.video';
    } else if (platform === 'win32') {
        params.arch = 'ia32';
        params['version-string'] = {
            CompanyName: pkg.author,
            FileDescription: pkg.description,
            InternalName: pkg.productName,
            OriginalFilename: pkg.productName + '.exe',

            // Deprecated
            // FileVersion: pkg.version,
            // ProductVersion: pkg.version,
            ProductName: pkg.productName
        };
    }

    return params;
};

let packagingDone = (err, appPaths, cb) => {
    if (err) {
        console.log('Error: ', err);

        return cb();
    }

    if (Array.isArray(appPaths)) {
        appPaths.forEach(appPath => packDir.path(appPath));
    }

    cb();
};

let packaging = (cb, platform) => {
    packager(
        getPackagerParams(platform),
        (err, appPaths) => packagingDone(err, appPaths, cb)
    );
};

// let onWebPack = (done) => {
//     return function (err, stats) {
//         if (err) {
//             console.log('Error', err);
//         } else {
//             console.log(stats.toString());
//         }

//         if (done) {
//             done();
//         }
//     };
// };

gulp.task('build:ui-vendor-css', () => {
	return gulp.src([
        vendor('flexboxgrid/dist/flexboxgrid.min.css'),
        vendor('material-design-lite/dist/material-grid.min.css')
    ])
		.pipe(concat('vendor.css'))
		.pipe(gulp.dest(paths.css));
});
gulp.task('build:ui-vendor-js', () => {
	return gulp.src([
        vendor('react/dist/react-with-addons.js'),
        vendor('react-dom/dist/react-dom.js')
    ])
		.pipe(concat('vendor.js'))
		.pipe(gulp.dest(paths.js));
});
gulp.task('build:ui-js', () => {
    // process.env.NODE_ENV = 'production';

	return gulp.src(paths.srcFiles)
        .pipe(concat('index.js'))
        .pipe(babel({
            sourceRoot: paths.src
        }))
		.pipe(gulp.dest(paths.js));
});

// gulp.task('build:backend', function (done) {
//     webpack(packBackend).run(onWebPack(done));
// });

gulp.task('build:ui-vendor', ['build:ui-vendor-css', 'build:ui-vendor-js']);
gulp.task('build:ui', ['build:ui-vendor', 'build:ui-js']);

gulp.task('clean:app', () => {
    let del = require('del');

    return del([
        paths.desktopApp + '/**/*'
    ]);
});

gulp.task('lint', ['build:ui-js'], () => {
    return gulp.src(['app/js/index.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        ;
});

gulp.task('build:app:osx', (cb) => packaging(cb, 'darwin'));
gulp.task('build:app:win', (cb) => packaging(cb, 'win32'));
gulp.task('build:app', ['clean:app', 'build:app:osx', 'build:app:win']);
gulp.task('build', ['build:ui', 'build:app']);
gulp.task('build:osx', ['clean:app', 'build:ui', 'build:app:osx']);
gulp.task('build:win', ['clean:app', 'build:ui', 'build:app:win']);

gulp.task('default', ['build']);
