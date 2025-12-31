<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6">Our Services</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card v-for="service in services" :key="service.title" class="hover:shadow-lg transition-shadow duration-300">
            <template #header>
                <div class="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-4xl text-primary">
                    <i :class="service.icon"></i>
                </div>
            </template>
            <template #title>{{ service.title }}</template>
            <template #content>
                <p class="m-0 text-sm text-gray-600 dark:text-gray-400">
                    {{ service.description }}
                </p>
            </template>
             <template #footer>
                <Button label="Learn More" size="small" outlined class="w-full" />
            </template>
        </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';

const services = ref([
    { title: 'Web Development', icon: 'pi pi-desktop', description: 'Custom web applications built with the latest technologies.' },
    { title: 'Mobile Apps', icon: 'pi pi-mobile', description: 'Native and cross-platform mobile solutions.' },
    { title: 'UI/UX Design', icon: 'pi pi-palette', description: 'User-centric design that delights your customers.' },
    { title: 'Consulting', icon: 'pi pi-comments', description: 'Expert advice to guide your digital strategy.' },
]);
</script>
