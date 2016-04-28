var gulp = require('gulp'),
	compass = require('gulp-compass'),
	minifyCSS = require('gulp-cssnano'),
	sourcemaps = require("gulp-sourcemaps"),
	rename = require("gulp-rename"),
	autoprefixer = require("gulp-autoprefixer"),
	imagemin = require('gulp-imagemin'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	notify = require('gulp-notify'),
	autopolyfiller = require('gulp-autopolyfiller'),
	plumber = require('gulp-plumber'),
	csslint = require('gulp-csslint'),
	jshint = require('gulp-jshint'),
	browserSync = require('browser-sync'),
	reload = browserSync.reload,
	resolveDependencies = require('gulp-resolve-dependencies'),
	child  = require('child_process'),
	runSequence = require('run-sequence');
	newer = require('gulp-newer');
	pngquant = require('imagemin-pngquant');

//Config
var hostname = "dev.monferrato.nl";

//Variables for building
var supportedBrowsers = ['> 1% in NL'];

//Error notification
var onError = function(err,task) {
	var message = err.plugin || err.message || err;
	console.log(err);
	notify.onError({
		'title': 'Error executing '+task,
		'subtitle': message,
		'message': 'Check the Terminal for more information.',
		'sound':  'Hero',
		'icon': false,
		'contentImage': false,
		'open': 0,
		'wait': false,
		'sticky':true
})(err);

};
//Task to compile scss files to css and run through autoprefixer
gulp.task('compass', function() {
	return gulp.src('frontend/scss/**/*.scss')
	.pipe(plumber({errorHandler: function(err){
		onError(err,'Compass')
		this.emit('end');
	}}))
	.pipe(compass({
		sass: 'frontend/scss/',
		css: 'frontend/css/',
		image: 'frontend/images',
		sourcemap:true
	}))
	.pipe(autoprefixer({
		browsers: supportedBrowsers,
	}))
	.pipe(gulp.dest('./frontend/css'))
});

//Task to minify css files and write to theme folder
gulp.task('css',['compass'], function() {
	return gulp.src('frontend/css/**/*.css')
	.pipe(plumber({errorHandler: function(err){
		onError(err,'CSS')
		this.emit('end');
	}}))
	.pipe(sourcemaps.init({loadMaps: true}))
	.pipe(minifyCSS())
	.pipe(rename({suffix: '.min'}))
	.pipe(sourcemaps.write('.'))
	.pipe(gulp.dest('public_html/css'))
});

//Image optimisation
gulp.task('imageoptim', function () {
	return gulp.src(['frontend/images/**/*.svg','frontend/images/**/*.SVG','frontend/images/**/*.jpg','frontend/images/**/*.JPG','frontend/images/**/*.jpeg','frontend/images/**/*.JPEG','frontend/images/**/*.png','frontend/images/**/*.PNG','frontend/images/**/*.gif','frontend/images/**/*.GIF'])
		.pipe(plumber({errorHandler: function(err){
			onError(err,'Imageoptim')
			this.emit('end');
		}}))
		.pipe(newer('public_html/images'))
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest('public_html/images'))
});

//JS library handling
gulp.task('js-libraries', function () {
	return gulp.src(['frontend/js/libs/libs.js'])
	.pipe(plumber({errorHandler: function(err){
		onError(err,'JS Libraries')
		this.emit('end');
	}}))
	.pipe(resolveDependencies({
		pattern: /\* @requires [\s-]*(.*\.js)/g
	}))
	.pipe(sourcemaps.init())
	.pipe(concat('libraries.js'))
	.pipe(uglify())
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest('public_html/js'))
});

//JS classes/default handling
gulp.task('js', function () {
	return gulp.src(['frontend/js/polyfills/*.js','frontend/js/classes/*.js','frontend/js/*.js'])
	.pipe(plumber({errorHandler: function(err){
		onError(err,'JS')
		this.emit('end');
	}}))
	.pipe(sourcemaps.init())
	.pipe(concat('default.js'))
	.pipe(uglify())
	.pipe(sourcemaps.write('./'))
	.pipe(gulp.dest('public_html/js'))
});

//Generate polyfills for js classes and js files using our supportedbrowsers variable
gulp.task('polyfills', function () {
	return gulp.src(['frontend/js/classes/*.js','frontend/js/*.js'])
	.pipe(plumber({errorHandler: function(err){
		onError(err,'Polyfills')
		this.emit('end');
	}}))
	.pipe(autopolyfiller('polyfills.js',{ browsers: supportedBrowsers }))
	.pipe(gulp.dest('frontend/js/polyfills'))
});

//Fonts
gulp.task('fonts',function(){
	return gulp.src('frontend/fonts/**/**')
	.pipe(plumber({errorHandler: function(err){
		onError(err,'FONTS')
		this.emit('end');
	}}))
	.pipe(gulp.dest('public_html/fonts'))
});

//JS hint
gulp.task('jshint',function(){
	return gulp.src(['frontend/js/classes/*.js','frontend/js/polyfills/*.js','frontend/js/*'])
	.pipe(jshint())
	.pipe(jshint.reporter('default'))
});

//CSS hint
gulp.task('csshint',function(){
	return gulp.src('frontend/css/*.css')
	.pipe(csslint({
		'box-model':false,
		'unique-headings':false,
		'font-sizes':false,
		'outline-none':false,
		'qualified-headings':false,
	}))
	.pipe(csslint.reporter());
});

//Reload task
gulp.task('reload',function(){
	reload();
});

//Watch task
gulp.task('watch',function(){
	browserSync({
		proxy: hostname
	},function(){
		gulp.watch('public_html/**/*.css',function(){
			gulp.src('public_html/**/*.css').pipe(browserSync.stream());
		});
		gulp.watch(['public_html/**/*.js','public_html/**/*.php','public_html/**/*.html'],function(){
			reload();
		});
		gulp.watch(['public_html/images/**/*.jpg','public_html/images/**/*.JPG','public_html/images/**/*.JPEG','public_html/images/**/*.png','public_html/images/**/*.gif','!public_html/images/**/*.svg'],function(){
			reload();
		});
	});
	gulp.watch('frontend/fonts/**/*',function(){ runSequence('fonts');} );
	gulp.watch('frontend/scss/**/*.scss',function(){ runSequence('css');} );
	gulp.watch(['frontend/images/**/*.svg','frontend/images/**/*.SVG'], function(){ runSequence('clean','imageoptim','css');} );
	gulp.watch(['frontend/images/**/*','!frontend/images/**/*.svg',], function(){ runSequence('imageoptim');} );
	gulp.watch('frontend/js/libs/*.js', function(){ runSequence('js-libraries');} );
	gulp.watch(['frontend/js/**/*.js'], function() { runSequence('js');} );
});

//Default task to restart when gulpfile changes
gulp.task('default', function(){
	var ps
	function spawn(){
		if(ps) ps.kill()
			ps = child.spawn('gulp', ['watch'], {stdio: 'inherit'})
	}
	spawn()
	gulp.watch('gulpfile.js', function(event){
		spawn()
	})
});
