import { describe, expect, it } from 'vitest';
import { QUIZ_STEPS, blankDraft, isStepComplete, toReadingRequest } from '../steps';
import { ReadingRequest } from '@/lib/api/reading';

const filled = {
  firstName: 'Elioth',
  birthDate: '1993-08-06',
  birthTime: '20:40',
  city: {
    name: 'Boulogne-Billancourt', country: 'FR', admin: '11',
    lat: 48.8352, lng: 2.2409, population: 108782, zone: 'Europe/Paris',
  },
  priorityAxis: 'business' as const,
};

describe('les cinq écrans', () => {
  it('sont exactement ceux du brief, dans l\'ordre', () => {
    expect(QUIZ_STEPS.map((s) => s.id)).toEqual([
      'firstName', 'birthDate', 'birthTime', 'city', 'priorityAxis',
    ]);
  });

  it('un brouillon vide ne valide aucun écran', () => {
    const draft = blankDraft();
    for (const step of QUIZ_STEPS) expect(isStepComplete(step.id, draft), step.id).toBe(false);
  });

  it('un brouillon complet valide les cinq', () => {
    for (const step of QUIZ_STEPS) expect(isStepComplete(step.id, filled), step.id).toBe(true);
  });
});

describe('validation écran par écran', () => {
  it('le prénom refuse le vide et les espaces seuls', () => {
    expect(isStepComplete('firstName', { ...filled, firstName: '' })).toBe(false);
    expect(isStepComplete('firstName', { ...filled, firstName: '   ' })).toBe(false);
    expect(isStepComplete('firstName', { ...filled, firstName: 'Éa' })).toBe(true);
  });

  it('la date refuse le format français et le futur', () => {
    expect(isStepComplete('birthDate', { ...filled, birthDate: '06/08/1993' })).toBe(false);
    expect(isStepComplete('birthDate', { ...filled, birthDate: '2099-01-01' })).toBe(false);
    expect(isStepComplete('birthDate', { ...filled, birthDate: '1993-13-01' })).toBe(false);
    expect(isStepComplete('birthDate', { ...filled, birthDate: '1993-08-06' })).toBe(true);
  });

  /**
   * L'heure ne se valide que renseignée. C'était le seul écran où ne pas savoir
   * était une réponse ; depuis le 11 octobre 2026, ce n'en est plus une — la case
   * « je ne la connais pas » est devenue un dépliant qui dit où la trouver.
   */
  it('l\'heure ne se valide que renseignée', () => {
    expect(isStepComplete('birthTime', { ...filled, birthTime: '' })).toBe(false);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '25:00' })).toBe(false);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '7:5' })).toBe(false);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '20:40' })).toBe(true);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '00:00' })).toBe(true);
  });

  it('la ville doit avoir été choisie dans la liste, pas seulement tapée', () => {
    expect(isStepComplete('city', { ...filled, city: null })).toBe(false);
    expect(isStepComplete('city', filled)).toBe(true);
  });
});

describe('passage à la demande de calcul', () => {
  it('compose une demande que le schéma accepte', () => {
    const request = toReadingRequest(filled, '2026-09-10');
    expect(request.lat).toBeCloseTo(48.8352, 4);
    expect(request.city).toBe('Boulogne-Billancourt');
    expect(request.birthTime).toBe('20:40');
    expect(request.startDate).toBe('2026-09-10');
    expect(request.zone).toBe('Europe/Paris');
  });

  /* Le brouillon ne peut plus produire une demande sans heure : le schéma la refuse. */
  it('ne compose jamais une demande que le schéma rejetterait', () => {
    const request = toReadingRequest({ ...filled, birthTime: '' }, '2026-09-10');
    expect(ReadingRequest.safeParse(request).success).toBe(false);
  });
});
