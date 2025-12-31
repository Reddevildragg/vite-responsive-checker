<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
    <div class="card">
        <Menubar :model="items">
             <template #start>
               <span class="font-bold text-xl mr-4 px-4 text-primary">MySite</span>
            </template>
            <template #item="{ item, props, hasSubmenu }">
                <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                    <a v-ripple :href="href" v-bind="props.action" @click="navigate">
                        <span :class="item.icon" />
                        <span class="ml-2">{{ item.label }}</span>
                    </a>
                </router-link>
                <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
                    <span :class="item.icon" />
                    <span class="ml-2">{{ item.label }}</span>
                    <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
                </a>
            </template>
        </Menubar>
    </div>

    <div class="container mx-auto mt-4 px-4 flex-grow">
      <Breadcrumb :model="breadcrumbs" class="mb-4 bg-transparent p-0" />
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm min-h-[500px]">
          <RouterView />
      </div>
    </div>

     <footer class="bg-gray-800 text-white p-6 mt-8">
      <div class="container mx-auto text-center">
        <p>&copy; 2024 MySite. All rights reserved.</p>
      </div>
    </footer>
  </div>
   <Toast />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterView, useRoute } from 'vue-router';
import Menubar from 'primevue/menubar';
import Breadcrumb from 'primevue/breadcrumb';
import Toast from 'primevue/toast';

const route = useRoute();

const items = ref([
    {
        label: 'Home',
        icon: 'pi pi-home',
        route: '/'
    },
    {
        label: 'About',
        icon: 'pi pi-info-circle',
        route: '/about'
    },
    {
        label: 'Services',
        icon: 'pi pi-briefcase',
        route: '/services'
    },
    {
        label: 'Contact',
        icon: 'pi pi-envelope',
        route: '/contact'
    }
]);

const breadcrumbs = computed(() => {
    const path = route.path;
    const home = { label: 'Home', route: '/' };
    if (path === '/') return [home];

    const parts = path.split('/').filter(Boolean);
    const trail = parts.map((part, index) => {
        const to = '/' + parts.slice(0, index + 1).join('/');
        return {
            label: part.charAt(0).toUpperCase() + part.slice(1),
            route: to
        };
    });

    return [home, ...trail];
});
</script>

<style scoped>
/* PrimeVue overrides or specific layout adjustments if needed */
</style>
