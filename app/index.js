'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var mkdirp = require('mkdirp');
var _s = require('underscore.string');

module.exports = generators.Base.extend({
  constructor: function () {
    var testLocal;

    generators.Base.apply(this, arguments);

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });

    // setup the test-framework property, Gruntfile template will need this
    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('babel', {
      desc: 'Use Babel',
      type: Boolean,
      defaults: true
    });

    if (this.options['test-framework'] === 'mocha') {
      testLocal = require.resolve('generator-mocha/generators/app/index.js');
    } else if (this.options['test-framework'] === 'jasmine') {
      testLocal = require.resolve('generator-jasmine/generators/app/index.js');
    }

    this.composeWith(this.options['test-framework'] + ':app', {
      options: {
        'skip-install': this.options['skip-install']
      }
    }, {
      local: testLocal
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
  },

  askFor: function () {
    var done = this.async();

    if (!this.options['skip-welcome-message']) {
      this.log(yosay('\'Allo \'allo! Out of the box I include Foundation 6 and a Gruntfile to build your app.'));
    }
    
    this.includeSass = true;
    this.includeFoundation = true;
    
    done();
  },

  writing: {
    gruntfile: function () {
      this.fs.copyTpl(
        this.templatePath('Gruntfile.js'),
        this.destinationPath('Gruntfile.js'),
        {
          pkg: this.pkg,
          includeSass: this.includeSass,
          includeFoundation: this.includeFoundation,
          testFramework: this.options['test-framework'],
          useBabel: this.options['babel']
        }
      );
    },

    packageJSON: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        {
          includeSass: this.includeSass,
          testFramework: this.options['test-framework'],
          useBabel: this.options['babel']
        }
      )
    },

    git: function () {
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore')
      );

      this.fs.copy(
        this.templatePath('gitattributes'),
        this.destinationPath('.gitattributes')
      );
    },

    bower: function () {
      var bowerJson = {
        name: _s.slugify(this.appname),
        private: true,
        dependencies: {}
      };

      if (this.includeFoundation) {
        bowerJson.dependencies['foundation-sites'] = '~6.0.5';
      }

      this.fs.writeJSON('bower.json', bowerJson);
      this.fs.copy(
        this.templatePath('bowerrc'),
        this.destinationPath('.bowerrc')
      );
    },

    editorConfig: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
    },

    scripts: function () {
      this.fs.copy(
        this.templatePath('main.js'),
        this.destinationPath('app/scripts/main.js')
      );
    },

    styles: function () {
      var stylesheet;

      if (this.includeSass) {
        stylesheet = 'main.scss';
      } else {
        stylesheet = 'main.css';
      }

      this.fs.copyTpl(
        this.templatePath(stylesheet),
        this.destinationPath('app/styles/' + stylesheet),
        {
          includeFoundation: this.includeFoundation,
          includeFontAwesome: this.includeFontAwesome,
          includeOcticons: this.includeOcticons,
          enableFlexbox: this.enableFlexbox
        }
      )
    },

    html: function () {
      this.fs.copy(
        this.templatePath('index.html'),
        this.destinationPath('app/index.html')
      );  
    },

    icons: function () {
      this.fs.copy(
        this.templatePath('favicon.ico'),
        this.destinationPath('app/favicon.ico')
      );

      this.fs.copy(
        this.templatePath('apple-touch-icon.png'),
        this.destinationPath('app/apple-touch-icon.png')
      );
    },

    robots: function () {
      this.fs.copy(
        this.templatePath('robots.txt'),
        this.destinationPath('app/robots.txt')
      );
    },

    misc: function () {
      mkdirp('app/images');
      mkdirp('app/fonts');
    }
  },

  install: function () {
    this.installDependencies({
      skipInstall: this.options['skip-install'],
      skipMessage: this.options['skip-install-message']
    });
  },

  end: function () {
    var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('grunt wiredep') +
      '.';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    // wire Bower packages to .html
    wiredep({
      bowerJson: bowerJson,
      src: 'app/index.html',
      exclude: ['bootstrap.js'],
      ignorePath: /^(\.\.\/)*\.\./
    });

    if (this.includeSass) {
      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        src: 'app/styles/*.scss',
        ignorePath: /^(\.\.\/)+/
      });
    }
  }
});
