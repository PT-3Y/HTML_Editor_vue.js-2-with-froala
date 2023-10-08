import {Froala, FroalaView} from './vue-froala'

export default {
    install: (app, options) => {
        app.component('Froala', Froala);
        app.component('FroalaView', FroalaView);
    }
}