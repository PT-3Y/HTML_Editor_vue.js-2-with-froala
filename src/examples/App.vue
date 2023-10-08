
<template>
  <div id="app">
    <h1>Vue adapter for the Froala WYSIWYG editor</h1>
    <div class="sample">
      <h2>Sample 1: Inline Edit</h2>
      <froala :config="titleOptions" v-model:value="myTitle"></froala>
      <input v-model="myTitle"/>
    </div>

    <div class="sample">
      <h2>Sample 2: Full Editor</h2>
      <froala v-model:value="content"></froala>
      <h4>Rendered Content:</h4>
      <froalaView v-model:value="content"></froalaView>
    </div>

    <div class="sample">
      <h2>Sample 3: Two way binding</h2>
      <froala id="sample3" v-model:value="twoWayContent"></froala>
      <froala id="sample4" v-model:value="twoWayContent"></froala>
    </div>

    <div class="sample">
      <h2>Sample 4: Manual Initialization</h2>
      <button class="manual" v-on:click="createEditor()" v-if="!showEditor">Initialize Editor</button>
      <button v-on:click="destroyEditor()" v-if="showEditor">Close Editor</button>
      <button v-on:click="deleteAll()" v-if="showEditor">Delete All</button>
      <froala id="sample5" :onManualControllerReady="initialize" v-model:value="sample3Text">
        <template v-slot>
          <div>Check out the <a href="https://www.froala.com/wysiwyg-editor">Froala Editor</a></div>
        </template>
      </froala>
    </div>

    <div class="sample">
      <h2>Sample 5: Editor on 'img' tag. Two way binding. Style is ignored (vueIgnoreAttrs) and will not be updated in the model.</h2>
      <froala id="sample6" :tag="'img'" :config="imageOptions" v-model:value="imgModel"></froala>
      <froala id="sample7" :tag="'img'" :config="imageOptions" v-model:value="imgModel"></froala>
      <h4>Model Obj:</h4>
      <div>{{imgModel}}</div>
    </div>

    <div class="sample">
      <h2>Sample 6: Editor on 'button' tag</h2>
      <froala id="sample8" :tag="'button'" v-model:value="buttonModel"></froala>
      <h4>Model Obj:</h4>
      <div>{{buttonModel}}</div>
    </div>


    <div class="sample">
      <h2>Sample 7: Editor on 'input' tag</h2>
      <froala id="sample9" :tag="'input'" v-model:value="inputModel"></froala>
      <h4>Model Obj:</h4>
      <div>{{inputModel}}</div>
    </div>

    <div class="sample">
      <h2>Sample 8: Editor on 'a' tag. Manual Initialization</h2>
      <button class="manual" v-on:click="linkCreateEditor()" v-if="!linkShowEditor">Initialize Editor</button>
      <button v-on:click="linkDestroyEditor()" v-if="linkShowEditor">Close Editor</button>
      <div>
        <froala id="sample10" class="blabla" :tag="'a'" :onManualControllerReady="initializeLink" v-model:value="linkModel">Froala Editor</froala>
      </div>
      <h4>Model Obj:</h4>
      <div>{{linkModel}}</div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {

      // Sample 1
      myTitle: '',
      titleOptions: {
        placeholderText: 'Edit Your Content Here!',
        charCounterCount: false,
        toolbarInline: true,
        events: {
          'initialized': function() {
            console.log('initialized', this);
          }
        }
      },

      // Sample 2
      content: '<span>My Document\'s Title</span>',

      // Sample 3
      twoWayContent: '',

      // Sample 4
      sample3Text: null,
      initControls: null,
      showEditor: false,
      deleteAll: null,
      destroyEditor: () => {
        this.initControls.destroy();
        this.showEditor = false;
      },
      createEditor: () => {
        this.initControls.initialize();
        this.showEditor = true;
      },
      initialize: (initControls) => {
        this.initControls = initControls;
        this.deleteAll = () => {
            this.initControls.getEditor().html.set('');
            this.initControls.getEditor().undo.reset();
            this.initControls.getEditor().undo.saveStep();
        };
      },

      // Sample 5
      imgModel: {
        src: require('./image.jpg')
      },
      imageOptions: {
        vueIgnoreAttrs: ['style']
      },

      // Sample 6
      buttonModel: {
        innerHTML: 'Click Me'
      },

      // Sample 7
      inputModel: {
        placeholder: 'I am an input!'
      },

      // Sample 8
      linkInitControls: null,
      linkShowEditor: false,
      linkCreateEditor: () => {
        this.linkInitControls.initialize();
        this.linkShowEditor = true;

      },
      linkDestroyEditor: () => {
        this.linkInitControls.destroy();
        this.linkShowEditor = false;
      },
      initializeLink: (linkInitControls) => {
        this.linkInitControls = linkInitControls;
      },
      linkModel: {
        href: 'https://www.froala.com/wysiwyg-editor'
      }
    }
  },
  created() {

  }
}
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
    margin-top: 60px;
  }
  body {
      padding: 20px;
  }

  .sample {
      padding-bottom: 50px;
      margin-left: 30px;
      border-top: 1px solid lightgray;
  }

  .manual {
      margin-bottom: 20px;
  }

  .button {
    margin-left: 5px;
  }
</style>
