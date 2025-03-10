{#await init()}
    <p class="animate-pulse dark:text-white py-4 md:max-w-lg">Loading...</p>
{:then _}
    {#if $signedIn}
        <div in:fade>
            {@render children()}

            <SignOut />
        </div>
    {:else}
        <div in:fade>
            <p class="dark:text-white pb-4 md:max-w-lg">
                {@render description()}
            </p>

            <SignIn {size} />
        </div>
    {/if}
{/await}