<script lang="ts">
    import Layout from '$core/components/Layout.svelte';
    import '$core/styles/app.scss';
</script>

<Layout>
    <svelte:fragment slot="title">Relying Party 🥳</svelte:fragment>

    <slot />
</Layout>
