import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

createApp(App).mount(
  (() => {
    const app = document.createElement('div');
    const contentview = document.querySelector('.contentview');
    if (contentview) {
      const app2 = document.createElement('div');
      const secondChild = contentview.childNodes[0];
      console.log('secondChild',secondChild)
      contentview?.insertBefore(app2, secondChild);
      return app2;

    }
    document.body.insertBefore(app, document.body.childNodes[0]);
    console.log('append mount')
    return app;
  })(),
);
