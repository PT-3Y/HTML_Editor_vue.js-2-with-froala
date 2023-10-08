// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.

import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/js/plugins.pkgd.min.js';

import App from './examples/App'
import { createApp } from 'vue'
import VueFroala from 'src';

const app = createApp(App);

app.use(VueFroala);
app.mount('#app');