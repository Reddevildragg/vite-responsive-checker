<template>
  <div class="p-8">
    <div class="text-center mb-12">
      <h1 class="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">Welcome to Our Platform</h1>
      <p class="text-xl text-gray-600 dark:text-gray-300">Building the future, one component at a time.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card>
        <template #title>Modern Design</template>
        <template #content>
          <p class="m-0">
            Utilizing Tailwind CSS v4 and PrimeVue for a sleek, modern aesthetic that looks great on any device.
          </p>
        </template>
      </Card>
      <Card>
        <template #title>Responsive</template>
        <template #content>
          <p class="m-0">
            Fully responsive layout ensuring your content is accessible on desktops, tablets, and mobile phones.
          </p>
        </template>
      </Card>
      <Card>
        <template #title>Performance</template>
        <template #content>
          <p class="m-0">
            Built with Vite and Vue 3 for blazing fast load times and smooth interactions.
          </p>
        </template>
      </Card>
    </div>

    <div class="mt-12">
        <Panel header="Latest News">
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
        </Panel>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
import Panel from 'primevue/panel';
</script>
