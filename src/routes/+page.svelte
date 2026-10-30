<script>
	/** @type {import('leaflet').Map | undefined} */
	let map;
	/** @type {typeof import('leaflet') | undefined} */
	let L;
	/** @type {import('leaflet').LayerGroup | undefined} */
	let markerLayer;
	/** @type {import('leaflet').Circle | undefined} */
	let searchCircle;
	import { onDestroy, onMount, untrack } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import cross from '#lib/assets/cross.svg';
	import search from '#lib/assets/search.svg';
	import reload from '#lib/assets/reload.svg';
	import market from '#lib/assets/market.svg';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let searchValue = $state(untrack(() => data.searchCity ?? ''));
	let mapReady = $state(false);

	const initialCenter = untrack(() =>
		data.center ? [data.center.lat, data.center.lon] : [51.505, -0.09]
	);
	const initialZoom = untrack(() => (data.center ? 15 : 13));

	$effect(() => {
		const datas = data.datas;
		const center = data.center;
		if (!mapReady || !map || !L || !markerLayer) return;
		markerLayer.clearLayers();
		for (const element of datas ?? []) {
			let cssIcon = L.divIcon({
				className: 'icon-markers',
				html: `<div class='marker-pin'></div><i>${element.id ?? ''}</i>`,
				iconSize: [30, 42],
				iconAnchor: [15, 42]
			});
			L.marker([Number(element.latitude), Number(element.longitude)], { icon: cssIcon })
				.addTo(markerLayer)
				.bindPopup(element.description ?? element.name ?? 'Restaurant');
		}

		searchCircle?.remove();
		searchCircle = undefined;
		if (center) {
			const latLng = L.latLng(Number(center.lat), Number(center.lon));
			searchCircle = L.circle(latLng, {
				radius: 1000,
				color: '#ff00ff',
				weight: 1,
				opacity: 0.65,
				fillColor: '#ff00ff',
				fillOpacity: 0.08
			}).addTo(map);
			map.setView(latLng, map.getZoom());
		}
	});

	onMount(async () => {
		L = await import('leaflet');
		map = L.map('map', {
			zoomControl: false
		}).setView(L.latLng(initialCenter[0], initialCenter[1]), initialZoom);
		L.control.zoom({ position: 'bottomright' }).addTo(map);
		L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);
		markerLayer = L.layerGroup().addTo(map);
		mapReady = true;
	});

	onDestroy(() => map?.remove());

	let selectedFilter = $state('ranked');

	let selectedRestaurants = $derived(
		data.restaurantList.filter((r) => r.list_status === selectedFilter)
	);

	let countRanked = $derived(data.restaurantList.filter((r) => r.list_status === 'ranked').length);
	let countWantToTry = $derived(
		data.restaurantList.filter((r) => r.list_status === 'want_to_try').length
	);

	let tab = [1, 2, 3, 4];

	console.log(selectedRestaurants);
	console.log('----------------------------------------');
	console.log(countRanked);
	console.log('----------------------------------------');
	console.log(countWantToTry);
	console.log('----------------------------------------');
</script>

<header>
	<form method="GET" action="/">
		<label>
			<img src={search} alt="search icon" />
			<input type="text" bind:value={searchValue} name="ville" />
			<div class="div-radius">
				<p>1km radius</p>
			</div>
			<button type="submit">
				<img src={reload} alt="reload icon" />
			</button>
		</label>
	</form>
	<button class="btn-owner">
		<img src={market} alt="market icon" />
		<p>Owner of restaurant ?</p>
	</button>
</header>

{#if data.searchError}
	<p class="search-error">{data.searchError}</p>
{/if}

<article>
	<section class="first-sect">
		<div class="top-head-fr">
			<h1>Tastemap.</h1>
			<button><img src={cross} alt="" /></button>
		</div>
		<div class="top-head-tag">
			<span></span>
			<p>{data.datas[0].city ?? "London"} · 1km radius · {countRanked + countWantToTry} places</p>
		</div>
		<hgroup>
			<h2>Your top tables</h2>
			<p>Ranked head-to-head, so your #3 really is better than your #4 — no five-star mush.</p>
		</hgroup>
	</section>
	<section class="sec-sect">
		<div class="btn-choose">
			<button
				class:active={selectedFilter === 'ranked'}
				onclick={() => (selectedFilter = 'ranked')}
			>
				Ranked <span>{countRanked}</span>
			</button>

			<button
				class:active={selectedFilter === 'want_to_try'}
				onclick={() => (selectedFilter = 'want_to_try')}
			>
				Want to try <span>{countWantToTry}</span>
			</button>
		</div>
		<div class="div-tags">
			<div class="tags-active">All</div>
			{#each data.tags as item (item.name)}
				<div>{item.name}</div>
			{/each}
		</div>
		<ul>
			{#each selectedRestaurants as item, i (data.photosList[i].restaurant_id)}
				{#if data.photosList[i].restaurant_id == 1}
					<li class="active">
						<h3>{item.id}</h3>
						<img src={data.photosList[i].url} alt="miam" />
						<div class="name-box-list">
							<p class="title-box-list">{item.name}</p>
							<p class="desc-box-list">{item.tagline} · {item.neighborhood}</p>
						</div>
						<div class="price-box">
							<div class="price-item">
								{#each tab as item}
									{#if item <= data.datas[i].price_tier}
										<p class="active">€</p>
									{:else}
										<p>€</p>
									{/if}
								{/each}
							</div>
							<span class="active">TOP PICK</span>
						</div>
					</li>
				{:else}
					<li>
						<h3>{item.id}</h3>
						<img src={data.photosList[i].url} alt="miam" />
						<div class="name-box-list">
							<p class="title-box-list">{item.name}</p>
							<p class="desc-box-list">{item.tagline} · {item.neighborhood}</p>
						</div>
						<div class="price-box">
							<div class="price-item">
								{#each tab as item}
									{#if item <= data.datas[i].price_tier}
										<p class="active">€</p>
									{:else}
										<p>€</p>
									{/if}
								{/each}
							</div>
							<span>TOP PICK</span>
						</div>
					</li>
				{/if}
			{/each}
		</ul>
	</section>
</article>

<link
	rel="stylesheet"
	href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
	integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
	crossorigin=""
/>
<div id="map"></div>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: end;
		gap: 20px;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 2;
		padding: 0 24px 0 0;
		gap: 390px;
	}
	header label {
		display: flex;
		flex-direction: row;
		align-items: center;
		border-radius: 9999px;
		padding: 6px 8px 6px 16px;
		background-color: rgba(255, 255, 255, 0.95);
		border: 1px solid #e4e5de;
		box-shadow: 0px 6px 16px 0px #1c1f1a12;
		box-shadow: 0px 1px 3px 0px #1c1f1a0d;
		backdrop-filter: blur(24px);
		margin-top: 30px;
		width: 100%;
	}
	header label input {
		color: #1c1f1a;
		font-size: 15px;
		font-weight: 500;
		margin: 0 8px;
		border: none;
		background: transparent;
		outline: none;
		width: 100%;
	}
	header label .div-radius {
		background-color: #f2f3ee;
		border-radius: 9999px;
		padding: 2px 10px;
		border: 1px solid #e4e5de;
		white-space: nowrap;
	}
	header label .div-radius p {
		color: #5e625b;
		font-size: 10px;
		font-weight: 600;
		margin: 0;
	}
	header label button {
		margin-left: 10px;
		background-color: transparent;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
	}
	header .btn-owner {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 8px 16px;
		border-radius: 9999px;
		background-color: #3e6b48;
		border: 1px solid #d3d5cc;
		box-shadow: 0px 6px 16px 0px #1c1f1a12;
		box-shadow: 0px 1px 3px 0px #1c1f1a0d;
		color: #fff;
		font-size: 14px;
		font-weight: 600;
		gap: 8px;
		margin-top: 30px;
		cursor: pointer;
		white-space: nowrap;
	}
	#map {
		height: 100vh;
		z-index: 1;
	}
	article {
		position: absolute;
		width: 419px;
		height: 100vh;
		z-index: 3;
		background-color: #fafaf7;
		border-right: 1px solid #e4e5de;
		box-shadow: 0px 4px 6px -4px #0000001a;
		box-shadow: 0px 10px 15px -3px #0000001a;
		backdrop-filter: blur(24px);
	}
	article .first-sect {
		display: flex;
		flex-direction: column;
		gap: 7.1px;
		padding: 20px 24px 12px 24px;
	}
	article .first-sect .top-head-fr {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}
	article .first-sect .top-head-fr h1 {
		color: #1c1f1a;
		font-size: 24px;
		font-weight: 700;
		margin-bottom: 13px;
	}
	article .first-sect .top-head-fr button {
		cursor: pointer;
		background-color: transparent;
	}
	article .first-sect .top-head-tag {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
		padding: 4px 12px;
		background-color: #f2f3ee;
		border: 1px solid #e4e5de;
		border-radius: 9999px;
		width: 59%;
	}
	article .first-sect .top-head-tag span {
		background-color: #3e6b48;
		height: 6px;
		width: 6px;
		display: block;
		border-radius: 9999px;
	}
	article .first-sect .top-head-tag p {
		color: #1c1f1a;
		font-size: 12px;
		font-weight: 500;
	}
	article .first-sect hgroup h2 {
		font-size: 32px;
		font-weight: 700;
		color: #1c1f1a;
	}
	article .first-sect hgroup p {
		font-size: 13px;
		font-weight: 400;
		color: #5e625b;
	}
	article .sec-sect .btn-choose {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 24px;
		margin-left: 24px;
	}
	article .sec-sect .btn-choose button {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6px;
		padding: 4px 0 10px 0;
		color: #9a9d95;
		font-weight: 500;
		font-size: 15px;
		border-bottom: 2px solid transparent;
		background-color: transparent;
		cursor: pointer;
	}
	article .sec-sect .btn-choose button span {
		color: #9a9d95;
	}
	article .sec-sect .btn-choose button.active {
		border-bottom-color: #1c1f1a;
		color: #1c1f1a;
	}
	article .sec-sect .div-tags {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 13px 24px 14px 24px;
		width: 100%;
		gap: 6px;
		overflow-x: scroll;
		scroll-behavior: auto;
		border-top: 1px solid #e4e5de99;
		border-bottom: 1px solid #e4e5de99;
	}
	article .sec-sect .div-tags::-webkit-scrollbar {
		display: none;
	}
	article .sec-sect .div-tags div {
		padding: 4px 12px;
		background-color: #f2f3ee;
		border: 1px solid #e4e5de;
		font-size: 12px;
		font-weight: 500;
		border-radius: 9999px;
		color: #1c1f1a;
		cursor: pointer;
	}
	article .sec-sect .div-tags div.tags-active {
		background-color: #3e6b48;
		color: #fff;
		border: none;
	}
	article .sec-sect ul {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 12px;
		max-height: 655px;
		overflow-y: auto;
		scrollbar-width: none;
	}
	article .sec-sect ul::-webkit-scrollbar {
		display: none;
	}
	article .sec-sect ul li {
		display: flex;
		flex-direction: row;
		align-items: center;
		padding: 12px;
	}
	article .sec-sect ul li h3 {
		font-size: 24px;
		font-weight: 700;
		color: #1c1f1a;
		margin-right: 12px;
	}
	article .sec-sect ul li img {
		height: 44px;
		width: 44px;
		border-radius: 6px;
		margin-right: 12px;
		border: 1px solid #e4e5de;
		box-shadow: 0px 1px 2px 0px #0000000d;
	}
	article .sec-sect ul li .name-box-list,
	article .sec-sect ul li .price-box {
		display: flex;
		flex-direction: column;
	}
	article .sec-sect ul li .name-box-list .title-box-list {
		font-size: 15px;
		font-weight: 600;
		color: #1c1f1a;
	}
	article .sec-sect ul li .name-box-list .desc-box-list {
		font-size: 12px;
		font-weight: 400;
		color: #5e625b;
	}
	article .sec-sect ul li .price-box {
		gap: 6.5px;
		margin-left: auto;
	}
	article .sec-sect ul li .price-box .price-item {
		display: flex;
		flex-direction: row;
		color: #c9cbc3;
		font-size: 14px;
		font-weight: 600;
	}
	article .sec-sect ul li .price-box .price-item p.active {
		color: #1c1f1a;
	}
	article .sec-sect ul li .price-box span {
		display: none;
	}
	article .sec-sect ul li .price-box span.active {
		color: #b9862e;
		font-size: 10px;
		font-weight: 700;
		display: block;
	}
	article .sec-sect ul li.active {
		background-color: #fbf1e1;
		border: 1px solid #edd3a3;
		border-radius: 48px;
	}
	.search-error {
		z-index: 1000;
		color: red;
	}
	:global(.icon-markers) {
		position: relative;
		text-align: center;
		background: transparent;
		border: none;
	}
	:global(.icon-markers .marker-pin) {
		width: 35px;
		height: 35px;
		border-radius: 0% 50% 50% 50%;
		background: #3e6b48;
		border: 2px solid #fff;
		position: absolute;
		transform: rotate(-45deg);
		left: 50%;
		top: 50%;
		margin: -15px 0 0 -15px;
	}

	:global(.icon-markers i) {
		position: absolute;
		top: 13px;
		left: 11px;
		font-style: normal;
		font-weight: 700;
		color: #fff;
		font-size: 12px;
		z-index: 1;
	}
</style>
