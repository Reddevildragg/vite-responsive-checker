<template>
  <section class="p-8">
    <h1 class="text-3xl font-bold">Home</h1>
    <p class="mt-2 text-slate-600">Welcome to the home page.</p>
    <RouterLink class="text-sky-600 underline" to="/about">Go to About →</RouterLink>

    <div class="mt-8">
      <h2 class="text-2xl font-bold">Plugin Component</h2>
      <!-- This component is registered by the example plugin -->
      <ExampleComponent />
    </div>
  </section>
</template>
