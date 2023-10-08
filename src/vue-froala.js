import FroalaEditor from 'froala-editor';
import { h, defineComponent } from 'vue';

export const Froala = defineComponent({
  name: 'froala',
  props: ['tag', 'value', 'config', 'onManualControllerReady', 'modelValue'],
  emits: ['update:value', 'manual-controller-ready'],
  watch: {
    value: function () {
      this.model = this.value;
      this.updateValue();
    }
  },

  render() {
    return h(
      this.currentTag,
      [this.$slots.default ? this.$slots.default()[0] : null]
    )
  },

  created: function () {
    this.currentTag = this.tag || this.currentTag;
    this.model = this.value;
  },

  // After first time render.
  mounted: function() {
    if (this.SPECIAL_TAGS.indexOf(this.currentTag) != -1) {

      this.hasSpecialTag = true;
    }

    if (this.onManualControllerReady) {
      this.generateManualController();
    } else {
      this.createEditor();
    }
  },

  beforeUnmount: function() {
    this.destroyEditor();
  },

  data() {

    return {

      initEvents: [],

      // Tag on which the editor is initialized.
      currentTag: 'div',

      // Editor element.
      _editor: null,

      // Current config.
      currentConfig: null,

      // Editor options config
      defaultConfig: {
        immediateVueModelUpdate: false,
        vueIgnoreAttrs: null
      },

      editorInitialized: false,

      SPECIAL_TAGS: ['img', 'button', 'input', 'a'],
      INNER_HTML_ATTR: 'innerHTML',
      hasSpecialTag: false,

      model: null,
      oldModel: null
    };
  },
  methods: {
    updateValue: function() {
      if (JSON.stringify(this.oldModel) == JSON.stringify(this.model)) {
        return;
      }
      this.setContent();
    },

    createEditor: function() {

      if (this.editorInitialized) {
        return;
      }

      this.currentConfig = this.clone(this.config || this.defaultConfig);
      this.currentConfig =  {...this.currentConfig};

      this.setContent(true);

      // Bind editor events.
      this.registerEvents();
      this.initListeners();

      this._editor = new FroalaEditor(this.$el, this.currentConfig)

      this.editorInitialized = true;

    },

      // Return clone object 
    clone: function (item) {
      const me = this;
      if (!item) {
        return item;
      } // null, undefined values check

      let types = [Number, String, Boolean],
        result;

      // normalizing primitives if someone did new String('aaa'), or new Number('444');
      types.forEach(function (type) {
        if (item instanceof type) {
          result = type(item);
        }
      });

      if (typeof result == "undefined") {
        if (Object.prototype.toString.call(item) === "[object Array]") {
          result = [];
          item.forEach(function (child, index, array) {
            result[index] = me.clone(child);
          });
        } else if (typeof item == "object") {
          // testing that this is DOM
          if (item.nodeType && typeof item.cloneNode == "function") {
            result = item.cloneNode(true);
          } else if (!item.prototype) { // check that this is a literal
            if (item instanceof Date) {
              result = new Date(item);
            } else {
              // it is an object literal
              result = {};
              for (var i in item) {
                result[i] = me.clone(item[i]);
              }
            }
          } else {
            if (false && item.constructor) {
              result = new item.constructor();
            } else {
              result = item;
            }
          }
        } else {
          result = item;
        }
      }
      return result;
    },

    setContent: function (firstTime) {

      if (!this.editorInitialized && !firstTime) {
        return;
      }

      if (this.model || this.model == '') {

        this.oldModel = this.model;

        if (this.hasSpecialTag) {
          this.setSpecialTagContent();
        } else {
          this.setNormalTagContent(firstTime);
        }
      }
    },

    setNormalTagContent: function(firstTime) {

      var self = this;

      function htmlSet() {

        self._editor.html.set(self.model || '');

        //This will reset the undo stack everytime the model changes externally. Can we fix this?

        self._editor.undo.saveStep();
        self._editor.undo.reset();

      }

      if (firstTime) {
        this.registerEvent('initialized', function () {
          htmlSet();
        });
      } else {
        htmlSet();
      }

    },

    setSpecialTagContent: function() {

      var tags = this.model;

      // add tags on element
      if (tags) {

        for (var attr in tags) {
          if (tags.hasOwnProperty(attr) && attr != this.INNER_HTML_ATTR) {
            this.$el.setAttribute(attr, tags[attr]);
          }
        }

        if (tags.hasOwnProperty(this.INNER_HTML_ATTR)) {
          this.$el.innerHTML = tags[this.INNER_HTML_ATTR];
        }
      }
    },

    destroyEditor: function() {

      if (this._editor) {

        this._editor.destroy();
        this.editorInitialized = false;
        this._editor = null;
      }
    },

    getEditor: function() {
      return this._editor;
    },

    generateManualController: function() {
      var controls = {
        initialize: this.createEditor,
        destroy: this.destroyEditor,
        getEditor: this.getEditor,
      };
      this.onManualControllerReady(controls);
    },

    updateModel: function () {
      var modelContent = '';
      if (this.hasSpecialTag) {
        var attributeNodes = this.$el.attributes;
        var attrs = {};

        for (var i = 0; i < attributeNodes.length; i++ ) {

          var attrName = attributeNodes[i].name;
          if (this.currentConfig.vueIgnoreAttrs && this.currentConfig.vueIgnoreAttrs.indexOf(attrName) != -1) {
            continue;
          }
          attrs[attrName] = attributeNodes[i].value;
        }

        if (this.$el.innerHTML) {
          attrs[this.INNER_HTML_ATTR] = this.$el.innerHTML;
        }

        modelContent = attrs;
      } else {

        var returnedHtml = this._editor.html.get();
        if (typeof returnedHtml === 'string') {
          modelContent = returnedHtml;
        }
      }

      this.oldModel = modelContent;
      this.$emit('update:value', modelContent);
    },

    initListeners: function() {
      var self = this;

      this.registerEvent('initialized', function () {
        if (self._editor.events) {
          // bind contentChange and keyup event to froalaModel
          self._editor.events.on('contentChanged', function () {
            self.updateModel();
          });

          if (self.currentConfig.immediateVueModelUpdate) {
            self._editor.events.on('keyup', function () {
              self.updateModel();
            });
          }
        }
      })
    },

    // register event on editor element
    registerEvent: function (eventName, callback) {

      if (!eventName || !callback) {
        return;
      }

      // Initialized event.
      if (eventName == 'initialized') {

        this.initEvents.push(callback);
      }
      else {
        if (!this.currentConfig.events) {
          this.currentConfig.events = {};
        }

        this.currentConfig.events[eventName] = callback;
      }

    },

    registerEvents: function () {
      // Handle initialized on its own.
      this.registerInitialized();

      // Get current events.
      var events = this.currentConfig.events;

      if (!events) {
        return;
      }

      for (var event in events) {
        if (events.hasOwnProperty(event) && event != 'initialized') {
          this.registerEvent(event, events[event]);
        }
      }
    },

    registerInitialized: function () {
      // Bind initialized.
      if(!this.currentConfig.events) {
        this.currentConfig.events = {};
      }

      // Set original initialized event.
      if (this.currentConfig.events.initialized) {
        this.registerEvent('initialized', this.currentConfig.events.initialized);
      }

      // Bind initialized event.
      this.currentConfig.events.initialized = () => {
        for (var i = 0; i < this.initEvents.length; i++) {
          this.initEvents[i].call(this._editor);
        }
      }
    }
  }
});

export const FroalaView = defineComponent({
  props: ['tag', 'value'],

  watch: {
    value: function (newValue) {
      this._element.innerHTML = newValue;
    }
  },

  created: function () {
    this.currentTag = this.tag || this.currentTag;
  },

  render: function () {
    return h(
      this.currentTag,
      {
        class: 'fr-view'
      }
    )
  },

  // After first time render.
  mounted: function() {
    this._element = this.$el;

    if (this.value) {
      this._element.innerHTML = this.value
    }
  },

  data() {

    return {
      currentTag: 'div',
      _element: null,
    };
  }
})