import { describe, it, expect } from 'vitest'
import {
  CORE_CHARACTERS,
  GUEST_CHARACTERS,
  ALL_CHARACTERS,
  getCharacterByKey,
  castGuestCharacters,
} from '@/lib/characters'

describe('characters', () => {
  describe('constants', () => {
    it('should have 3 core characters', () => {
      expect(CORE_CHARACTERS).toHaveLength(3)
    })

    it('should have 5 guest characters', () => {
      expect(GUEST_CHARACTERS).toHaveLength(5)
    })

    it('ALL_CHARACTERS should have 8 total (3 core + 5 guest)', () => {
      expect(ALL_CHARACTERS).toHaveLength(8)
    })

    it('each core character should have type "core"', () => {
      CORE_CHARACTERS.forEach((c) => {
        expect(c.type).toBe('core')
      })
    })

    it('each guest character should have type "guest" and triggerTopics', () => {
      GUEST_CHARACTERS.forEach((c) => {
        expect(c.type).toBe('guest')
        expect(c.triggerTopics).toBeDefined()
        expect(c.triggerTopics!.length).toBeGreaterThan(0)
      })
    })

    it('all character keys should be unique', () => {
      const keys = ALL_CHARACTERS.map((c) => c.key)
      expect(new Set(keys).size).toBe(keys.length)
    })
  })

  describe('getCharacterByKey', () => {
    it('should return tanaka for key "tanaka"', () => {
      const char = getCharacterByKey('tanaka')
      expect(char).toBeDefined()
      expect(char!.name).toBe('田中 太郎')
      expect(char!.role).toBe('宅建業者の営業マン')
    })

    it('should return kuroda for key "kuroda"', () => {
      const char = getCharacterByKey('kuroda')
      expect(char).toBeDefined()
      expect(char!.type).toBe('guest')
    })

    it('should return undefined for unknown key', () => {
      expect(getCharacterByKey('unknown')).toBeUndefined()
    })
  })

  describe('castGuestCharacters', () => {
    it('should cast suzuki for 賃貸借 topic', () => {
      const guests = castGuestCharacters('賃貸借契約の基本')
      expect(guests.some((g) => g.key === 'suzuki')).toBe(true)
    })

    it('should cast kuroda for 詐欺 topic', () => {
      const guests = castGuestCharacters('詐欺による意思表示')
      expect(guests.some((g) => g.key === 'kuroda')).toBe(true)
    })

    it('should cast nakamura for 抵当権 topic', () => {
      const guests = castGuestCharacters('抵当権の効力')
      expect(guests.some((g) => g.key === 'nakamura')).toBe(true)
    })

    it('should cast kimura for 都市計画法 topic', () => {
      const guests = castGuestCharacters('都市計画法の概要')
      expect(guests.some((g) => g.key === 'kimura')).toBe(true)
    })

    it('should cast takahashi for 固定資産税 topic', () => {
      const guests = castGuestCharacters('固定資産税の計算')
      expect(guests.some((g) => g.key === 'takahashi')).toBe(true)
    })

    it('should return max 2 guests even if multiple match', () => {
      // A topic that might match multiple guests
      const guests = castGuestCharacters('賃貸借の抵当権と詐欺')
      expect(guests.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array for unrelated topic', () => {
      const guests = castGuestCharacters('特に関連なしのトピック')
      expect(guests).toHaveLength(0)
    })
  })
})
