import { describe, expect, it } from 'vitest';
import { QUIZ_STEPS, blankDraft, isStepComplete, toReadingRequest } from '../steps';

const filled = {
  firstName: 'Elioth',
  birthDate: '1993-08-06',
  birthTime: '20:40',
  timeKnown: true,
  city: { name: 'Boulogne-Billancourt', country: 'FR', admin: '11', lat: 48.8352, lng: 2.2409, population: 108782 },
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
   * L'écran de l'heure se valide de deux façons : une heure renseignée, ou la case
   * « je ne la connais pas ». C'est le seul écran où ne pas savoir est une réponse.
   */
  it('l\'heure se valide aussi en déclarant qu\'on ne la connaît pas', () => {
    expect(isStepComplete('birthTime', { ...filled, birthTime: '', timeKnown: true })).toBe(false);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '25:00', timeKnown: true })).toBe(false);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '', timeKnown: false })).toBe(true);
    expect(isStepComplete('birthTime', { ...filled, birthTime: '20:40', timeKnown: true })).toBe(true);
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
    expect(request.timeKnown).toBe(true);
    expect(request.startDate).toBe('2026-09-10');
  });

  /** Heure inconnue : le champ part à `null`, jamais une heure inventée. */
  it('n\'invente jamais d\'heure quand elle est inconnue', () => {
    const request = toReadingRequest({ ...filled, timeKnown: false, birthTime: '' }, '2026-09-10');
    expect(request.birthTime).toBeNull();
    expect(request.timeKnown).toBe(false);
  });
});
