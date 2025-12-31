<template>
  <div class="p-8 max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center">Contact Us</h1>

    <Card>
        <template #content>
            <form class="flex flex-col gap-4" @submit.prevent="submitForm">
                <div class="flex flex-col gap-2">
                    <label for="name" class="font-semibold">Name</label>
                    <InputText id="name" v-model="form.name" placeholder="Your Name" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label for="email" class="font-semibold">Email</label>
                    <InputText id="email" v-model="form.email" type="email" placeholder="your@email.com" />
                </div>
                 <div class="flex flex-col gap-2">
                    <label for="message" class="font-semibold">Message</label>
                    <Textarea id="message" v-model="form.message" rows="5" placeholder="How can we help?" />
                </div>
                <Button type="submit" label="Send Message" icon="pi pi-send" />
            </form>
        </template>
    </Card>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const form = ref({
    name: '',
    email: '',
    message: ''
});

const submitForm = () => {
    toast.add({ severity: 'success', summary: 'Success', detail: 'Message sent successfully!', life: 3000 });
    form.value = { name: '', email: '', message: '' };
};
</script>
