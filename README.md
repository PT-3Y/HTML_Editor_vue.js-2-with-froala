# Vue JS Froala WYSIWYG Editor

[![npm](https://img.shields.io/npm/v/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/dm/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)
[![npm](https://img.shields.io/npm/l/vue-froala-wysiwyg.svg)](https://www.npmjs.com/package/vue-froala-wysiwyg)

>vue-froala-wyswiyg provides Vue bindings to the Froala WYSIWYG editor VERSION 3.

## Compatibility

- v3 later
  - Vue.js 3.x

## Installation

Install `vue-froala-wysiwyg` from `npm`

```bash
npm install vue-froala-wysiwyg --save
```



## Integration

#### 1. Require and use Froala Editor component inside your application.

#### main.js file:
```javascript
//Import Froala Editor 
import 'froala-editor/js/plugins.pkgd.min.js';
//Import third party plugins
import 'froala-editor/js/third_party/embedly.min';
import 'froala-editor/js/third_party/font_awesome.min';
import 'froala-editor/js/third_party/spell_checker.min';
import 'froala-editor/js/third_party/image_tui.min';
// Import Froala Editor css files.
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';

import App from './App'
import { createApp } from 'vue'
import VueFroala from 'vue-froala-wysiwyg';

const app = createApp(App);          

app.use(VueFroala);
app.mount('#app');
```

#### App.vue file:
```javascript
<template>
  <div id="app">
    <froala id="edit" :tag="'textarea'" :config="config" v-model:value="model"></froala>
  </div>
</template>

<script>

export default {
  name: 'App',
  data () {
    return {
      config: {
        events: {
          initialized: function () {
            console.log('initialized')
          }
        }
      },
      model: 'Edit Your Content Here!'
    }
  }
}
</script>
```



#### 2. Make sure you have the right Webpack settings for loading the CSS files.

```javascript
var webpack = require('webpack')
var path = require('path')

module.exports = {
  module: {
    loaders: [

      // ...

      // Css loader.
      {
        test: /\.css$/,
        loader: 'cssLoader'
      }

    ]
  },
  vue: {
    loaders: {

      // ...

      // Css loader for Webpack 1.x .
      css: 'cssLoader'
    }
  }
})
```

## Usage

### Initialize

```javascript
// If model is initialized, 'Init text' text child will be overwritten.
<froala :tag="'textarea'" :config="config" v-model:value="model">Init text</froala>
```

**:tag** attr is used to tell on which tag the editor is initialized.

There are special tags: **a**, **button**, **img**, **input**.



### Options

You can pass editor options as component attribute (optional).

`:config="config"`

You can pass any existing Froala option. Consult the [Froala documentation](https://www.froala.com/wysiwyg-editor/docs/options) to view the list of all the available options:

```jon
config: {
  placeholderText: 'Edit Your Content Here!',
  charCounterCount: false
}
```

Aditional option is used:
* **immediateVueModelUpdate**: (default: false) This option updates the Vue model as soon as a key is released in the editor. Note that it may affect performances.

### Events and Methods

Events can be passed in with the options, with a key events and object where the key is the event name and the value is the callback function.

```javascript
config: {
  placeholder: "Edit Me",
  events : {
    focus : function(e, editor) {
      console.log(editor.selection.get());
    }
  }
}
```

Using the editor instance from the arguments of the callback you can call editor methods as described in the [method docs](http://froala.com/wysiwyg-editor/docs/methods).

Froala events are described in the [events docs](https://froala.com/wysiwyg-editor/docs/events).

### Model

The WYSIWYG HTML editor content model. Two way binding is suported.

`v-model:value="model"`

Use the content in other places:

```javascript
<input v-model:value="model"/>
```

### Special tags
You can also use the editor on **img**, **button**, **input** and **a** tags:

```javascript
<froala :tag="img" v-model:value="imgModel"></froala>
```

The model must be an object containing the attributes for your special tags. Example:

```javascript
imgModel: {
  src: require('./image.jpg')
}
```

The model will change as the attributes change during usage.

* The model can contain a special attribute named **innerHTML** which inserts innerHTML in the element: If you are using 'button' tag, you can specify the button text like this:

```javascript
buttonModel: {
  innerHTML: 'Click Me'
}
```
As the button text is modified by the editor, the **innerHTML** attribute from buttonModel model will be modified too.

#### Specific option for special tags

* **vueIgnoreAttrs**: (default: null) This option is an array of attributes that you want to ignore when the editor updates the v-model:

 ```javascript
config: {
  vueIgnoreAttrs: ['class', 'id']
}
 ```
### Custom Buttons

You can pass the custom buttons to the editor by following way:
#### App.vue file:
```javascript
<script>
import FroalaEditor from 'froala-editor';

FroalaEditor.DefineIcon('alert', {NAME: 'info', SVG_KEY: 'help'});
  FroalaEditor.RegisterCommand('alert', {
    title: 'Hello',
    focus: false,
    undo: false,
    refreshAfterCallback: false,
    callback: function () {
      alert('Hello!');
    }
  });

  FroalaEditor.DefineIcon('clear', {NAME: 'remove', SVG_KEY: 'remove'});
  FroalaEditor.RegisterCommand('clear', {
    title: 'Clear HTML',
    focus: false,
    undo: true,
    refreshAfterCallback: true,
    callback: function () {
      this.html.set('');
      this.events.focus();
    }
  });

  FroalaEditor.DefineIcon('insert', {NAME: 'plus', SVG_KEY: 'add'});
  FroalaEditor.RegisterCommand('insert', {
    title: 'Insert HTML',
    focus: true,
    undo: true,
    refreshAfterCallback: true,
    callback: function () {
      this.html.insert('My New HTML');
    }
  });
  </script>
  
 ```
 Now you can use these buttons in options:
 ```javascript
 toolbarButtons: [['undo', 'redo' , 'bold'], ['alert', 'clear', 'insert']],

 ```


## Manual Instantiation

Gets the functionality to operate on the editor: create, destroy and get editor instance. Use it if you want to manually initialize the editor.

`:onManualControllerReady="initialize"`

```javascript
initialize: function(initControls) {
  this.initControls = initControls;
  this.deleteAll = () => {
      this.initControls.getEditor().html.set('');
      this.initControls.getEditor().undo.reset();
      this.initControls.getEditor().undo.saveStep();
  };
}
```

The object received by the function will contain the following methods:

- **initialize**: Call this method to initialize the Froala Editor
- **destroy**: Call this method to destroy the Froala Editor
- **getEditor**: Call this method to retrieve the editor that was created. This method will return *null* if the editor was not yet created




## Displaying HTML

To display content created with the froala editor use the `froalaView` component.

```javascript
<froala v-model:value="content"></froala>

<froalaView v-model:value="content"></froalaView>
```



## License

The `vue-froala-wyswiyg` project is under MIT license. However, in order to use Froala WYSIWYG HTML Editor plugin you should purchase a license for it.

Froala Editor has [3 different licenses](http://froala.com/wysiwyg-editor/pricing) for commercial use.
For details please see [License Agreement](http://froala.com/wysiwyg-editor/terms).



## Development environment setup

If you want to contribute to vue-froala-wyswiyg, you will first need to install the required tools to get the project going.

#### Prerequisites

* [Node Package Manager](https://npmjs.org/) (NPM)
* [Git](http://git-scm.com/)

#### Install dependencies

    $ npm install

#### Build

    $ npm run build

#### Run Demo

    $ npm run dev
