'use client';

import { useEffect, useRef, useState } from 'react';
import type { City } from '@/lib/cities/search';

/**
 * Choix de la ville de naissance.
 *
 * La sélection doit venir de la liste, jamais de la saisie libre : c'est elle qui
 * porte les coordonnées et donc le fuseau. Une commune de moins de mille habitants
 * n'est pas dans la base — on le dit franchement plutôt que de laisser l'écran vide.
 */
export function CityField({ value, onChange }: { value: City | null; onChange: (city: City | null) => void }) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [results, setResults] = useState<City[]>([]);
  const [searched, setSearched] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (value && query === value.name) return;
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
        const body = await response.json();
        setResults(body.cities ?? []);
      } catch {
        setResults([]);
      }
      setSearched(true);
    }, 140);
    return () => clearTimeout(timer);
  }, [query, value]);

  return (
    <div>
      <input
        ref={input}
        id="quiz-city"
        className="w-full border-b border-ink/15 bg-transparent pb-2 text-[26px] font-medium tracking-[-0.02em] outline-none placeholder:text-ink/25"
        type="text"
        autoComplete="off"
        placeholder="Boulogne-Billancourt"
        value={query}
        aria-label="Ville de naissance"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
      />

      {value ? (
        <p className="technical mt-3 text-[11px] opacity-50">
          {value.lat.toFixed(4)}°N {value.lng.toFixed(4)}°E
        </p>
      ) : null}

      <ul className="mt-3 grid gap-0" role="listbox" aria-label="Villes proposées">
        {results.map((city) => (
          <li key={`${city.name}-${city.country}-${city.lat}`}>
            <button
              type="button"
              className="flex w-full items-baseline justify-between gap-3 border-b border-ink/8 py-2.5 text-left"
              onClick={() => {
                onChange(city);
                setQuery(city.name);
                setResults([]);
              }}
            >
              <span className="text-[15px]">{city.name}</span>
              <span className="technical text-[10px] opacity-45">{city.country}</span>
            </button>
          </li>
        ))}
      </ul>

      {searched && !results.length && !value ? (
        <p className="technical mt-3 text-[11px] leading-relaxed opacity-55">
          Rien à ce nom. Les communes de moins de mille habitants ne sont pas dans la base —
          prends la ville voisine, quelques kilomètres ne changent rien au thème.
        </p>
      ) : null}
    </div>
  );
}
