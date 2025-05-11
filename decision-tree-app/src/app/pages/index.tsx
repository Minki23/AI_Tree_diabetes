import Head from 'next/head';
import React from 'react';
import { App } from '../app';


export default function Index() {
  return (
    <React.StrictMode>
        <Head>
          <title>Konstruktor drzewa decyzyjnego</title>
          <meta name="description" content="Aplikacja do tworzenia drzew decyzyjnych dla diagnostyki cukrzycy" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <App/>
  </React.StrictMode>
  );
}
