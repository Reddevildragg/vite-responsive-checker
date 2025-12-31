<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6">About Us</h1>

    <div class="flex flex-col md:flex-row gap-8 items-start">
        <div class="flex-1">
            <p class="text-lg leading-relaxed mb-4">
                We are a passionate team of developers dedicated to creating amazing web experiences.
                Our mission is to provide high-quality, reusable components that speed up development without compromising on design.
            </p>
            <p class="text-lg leading-relaxed">
                Founded in 2024, we have quickly grown to become a trusted resource for developers worldwide.
            </p>
        </div>
        <div class="w-full md:w-1/3">
             <Card>
                <template #title>Our Stats</template>
                <template #content>
                    <ul class="list-none p-0 m-0 space-y-3">
                        <li class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span>Founded</span>
                            <span class="font-bold">2024</span>
                        </li>
                        <li class="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                            <span>Team Size</span>
                            <span class="font-bold">15+</span>
                        </li>
                        <li class="flex justify-between pb-2">
                            <span>Projects</span>
                            <span class="font-bold">100+</span>
                        </li>
                    </ul>
                </template>
            </Card>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Card from 'primevue/card';
</script>
