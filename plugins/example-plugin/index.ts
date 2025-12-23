import type { App } from 'vue';
import ExampleComponent from './ExampleComponent.vue';

export default {
  install(app: App) {
    app.component('ExampleComponent', ExampleComponent);
    console.log('Example Plugin Installed');
  }
};
