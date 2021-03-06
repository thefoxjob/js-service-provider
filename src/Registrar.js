'use strict';

import ServiceProvider from './ServiceProvider';
import IoCAware from './Mixins/IoCAware';
import mix from '@vestergaard-company/js-mixin';

/**
 * has Booted symbol
 *
 * @type {Symbol}
 * @private
 */
const _hasBooted = Symbol('has-booted');

/**
 * booted Providers symbol
 *
 * @type {Symbol}
 * @private
 */
const _bootedProviders = Symbol('booted-providers');

/**
 * providers symbol
 *
 * @type {Symbol}
 * @private
 */
const _providers = Symbol('providers');

/**
 * Registrar
 *
 * @description Registers and boots service providers
 *
 * @author Alin Eugen Deac <aedart@gmail.com>
 */
class Registrar extends mix(Object).with( IoCAware ){

    /**
     * Creates a new Registrar instance
     *
     * @param {Container|Object} ioc
     */
    constructor(ioc){
        super();

        this.ioc = ioc;
        this.providers = [];
        this.hasBooted = false;
        this.bootedProviders = new WeakSet();
    }

    /**
     * Set has Booted
     *
     * @see bootProviders()
     *
     * @param {boolean} hasBooted True if registrar has booted it's providers, false if not
     */
    set hasBooted(hasBooted) {
        this[_hasBooted] = hasBooted;
    }

    /**
     * Get has Booted
     *
     * @see bootProviders()
     *
     * @return {boolean} True if registrar has booted it's providers, false if not
     */
    get hasBooted() {
        return this[_hasBooted];
    }

    /**
     * Set providers
     *
     * @param {Array.<ServiceProvider>} list List of providers
     */
    set providers(list) {
        this[_providers] = list;
    }

    /**
     * Get providers
     *
     * @return {Array.<ServiceProvider>} List of providers
     */
    get providers() {
        return this[_providers];
    }

    /**
     * Set booted Providers
     *
     * @param {WeakSet} bootedProviders Set of booted providers
     */
    set bootedProviders(bootedProviders) {
        this[_bootedProviders] = bootedProviders;
    }

    /**
     * Get booted Providers
     *
     * @return {WeakSet} Set of booted providers
     */
    get bootedProviders() {
        return this[_bootedProviders];
    }

    /**
     * Register a service provider
     *
     * Method will invoke "register" method on provider
     *
     * @param {ServiceProvider|function} provider Instance of service provider or function which will be newed up
     * @param {boolean} [boot] If true, provider's "boot" method will be triggered.
     *
     * @return {ServiceProvider} The booted provider instance
     */
    register(provider, boot = true){
        // New up the service provider, if not already an instance
        if( ! (provider instanceof ServiceProvider)){
            provider = new provider(this.ioc);
        }

        // Invoke register
        provider.register();

        // Boot if needed
        if(boot){
            this.bootProviders([provider]);
        }

        // Add provider to list of providers
        this.providers[this.providers.length] = provider;

        // Finally, return the registered instance
        return provider;
    }

    /**
     * Register a collection of service providers
     *
     * @param {Array<ServiceProvider|function>} providers Instances of service provider or functions which will be newed up
     * @param {boolean} [boot] If true, provider's "boot" method will be triggered.
     * @param {boolean} [delayBoot] If true, all providers are registered first and only then are booted.
     *                              APPLIES ONLY if "boot" is set to true. If false, then
     *                              each given provider is booted as soon as it has been registered.
     *
     * @return {void}
     */
    registerProviders(providers, boot = true, delayBoot = true){
        // Determine if each provider should boot individually
        // while it is being registered
        let bootIndividually = (boot && !delayBoot);

        // List of providers that eventually need to be booted
        let providersToBoot = [];

        // Register each provider
        let len = providers.length;
        for(let i = 0; i < len; i++){
            providersToBoot[providersToBoot.length] = this.register(providers[i], bootIndividually);
        }

        // If we do not need to perform delayed boot of providers,
        // e.g. if all have been booted individually and no delayed
        // boot is requested, then we stop here.
        if( ! boot || ! delayBoot){
            return;
        }

        // Boot the providers
        this.bootProviders(providersToBoot);
    }

    /**
     * Boot all registered service providers
     *
     * Method will invoke "boot" on all providers that
     * have yet not booted.
     *
     * @see Registrar.bootedProviders
     *
     * @param {Array.<ServiceProvider>|null} [providers] If null given, method will default to registered providers
     * @param {boolean} [force] If true, providers are booted no matter what. If false, then providers are only
     *                          booted if not already booted.
     *
     * @return {void}
     */
    bootProviders(providers = null, force = false){
        let providersToBoot = providers;

        // Default to registered providers if no providers given
        if(providersToBoot === null){
            providersToBoot = this.providers.filter((provider) => {
                return ( ! this.bootedProviders.has(provider));
            });
        }

        // Boot operation...
        let len = providersToBoot.length;
        for(let i = 0; i < len; i++){
            let provider = providersToBoot[i];

            // Boot only if not already booted - or if forced
            if(force || ! this.bootedProviders.has(provider)){
                provider.boot();
                this.bootedProviders.add(provider);
            }
        }
    }
}

export default Registrar;