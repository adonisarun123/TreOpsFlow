import {
    isValidEmail,
    isValidIndianPhone,
    isValidProgramDate,
    isValidPaxRange,
    isValidBudget,
    isValidFileSize,
    isValidDocumentType,
    isValidMediaType,
    isValidZFDRating,
    areZFDCommentsRequired,
    canProgressFromStage1,
    canProgressFromStage2,
    canProgressFromStage3,
    canProgressFromStage4,
    canProgressFromStage5,
    validateStage1Fields,
    validateStageProgression,
    getStageName,
    STAGE_NAMES,
} from '@/lib/validations'

// ─── UTILITY VALIDATORS ───

describe('isValidEmail', () => {
    it('accepts valid emails', () => {
        expect(isValidEmail('test@example.com')).toBe(true)
        expect(isValidEmail('admin@trebound.com')).toBe(true)
    })
    it('rejects invalid emails', () => {
        expect(isValidEmail('')).toBe(false)
        expect(isValidEmail('not-an-email')).toBe(false)
        expect(isValidEmail('@missing.com')).toBe(false)
    })
})

describe('isValidIndianPhone', () => {
    it('accepts valid 10-digit Indian numbers', () => {
        expect(isValidIndianPhone('9876543210')).toBe(true)
        expect(isValidIndianPhone('6000000000')).toBe(true)
    })
    it('rejects invalid numbers', () => {
        expect(isValidIndianPhone('5876543210')).toBe(false) // starts with 5
        expect(isValidIndianPhone('98765')).toBe(false)       // too short
        expect(isValidIndianPhone('12345678901')).toBe(false)  // too long
    })
})

describe('isValidProgramDate', () => {
    it('accepts today and future dates', () => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        expect(isValidProgramDate(tomorrow.toISOString())).toBe(true)
    })
    it('rejects past dates', () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        expect(isValidProgramDate(yesterday.toISOString())).toBe(false)
    })
})

describe('isValidPaxRange', () => {
    it('accepts valid ranges', () => {
        expect(isValidPaxRange(10, 50)).toBe(true)
        expect(isValidPaxRange(1, 1)).toBe(true)
    })
    it('rejects invalid ranges', () => {
        expect(isValidPaxRange(0, 50)).toBe(false)      // min must be > 0
        expect(isValidPaxRange(50, 10)).toBe(false)      // min > max
        expect(isValidPaxRange(-1, 10)).toBe(false)      // negative
    })
})

describe('isValidBudget', () => {
    it('accepts positive budgets', () => {
        expect(isValidBudget(100000)).toBe(true)
    })
    it('rejects zero and negative budgets', () => {
        expect(isValidBudget(0)).toBe(false)
        expect(isValidBudget(-5000)).toBe(false)
    })
})

describe('isValidFileSize', () => {
    it('accepts files under 10MB', () => {
        expect(isValidFileSize(5 * 1024 * 1024)).toBe(true) // 5MB
    })
    it('rejects files over 10MB', () => {
        expect(isValidFileSize(11 * 1024 * 1024)).toBe(false) // 11MB
    })
})

describe('isValidDocumentType', () => {
    it('accepts pdf, doc, docx, xls, xlsx', () => {
        expect(isValidDocumentType('file.pdf')).toBe(true)
        expect(isValidDocumentType('report.xlsx')).toBe(true)
    })
    it('rejects other extensions', () => {
        expect(isValidDocumentType('image.jpg')).toBe(false)
        expect(isValidDocumentType('script.exe')).toBe(false)
    })
})

describe('isValidMediaType', () => {
    it('accepts image and video formats', () => {
        expect(isValidMediaType('photo.jpg')).toBe(true)
        expect(isValidMediaType('video.mp4')).toBe(true)
    })
    it('rejects non-media', () => {
        expect(isValidMediaType('doc.pdf')).toBe(false)
    })
})

describe('isValidZFDRating', () => {
    it('accepts 1-5', () => {
        expect(isValidZFDRating(1)).toBe(true)
        expect(isValidZFDRating(5)).toBe(true)
    })
    it('rejects out-of-range', () => {
        expect(isValidZFDRating(0)).toBe(false)
        expect(isValidZFDRating(6)).toBe(false)
    })
})

describe('areZFDCommentsRequired', () => {
    it('requires comments for rating ≤ 3', () => {
        expect(areZFDCommentsRequired(2, 'Short')).toBe(false)        // too short
        expect(areZFDCommentsRequired(3, 'This is detailed enough comments')).toBe(true)
        expect(areZFDCommentsRequired(3, undefined)).toBe(false)
    })
    it('does not require comments for rating > 3', () => {
        expect(areZFDCommentsRequired(4)).toBe(true)
        expect(areZFDCommentsRequired(5)).toBe(true)
    })
})

// ─── STAGE PROGRESSION VALIDATORS ───

describe('canProgressFromStage1', () => {
    it('passes when finance approved', () => {
        const result = canProgressFromStage1({ financeApprovalReceived: true })
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
    it('fails without finance approval', () => {
        const result = canProgressFromStage1({ financeApprovalReceived: false })
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Finance approval required before moving to Accepted Handover')
    })
})

describe('canProgressFromStage2', () => {
    const validStage2 = {
        opsSPOCAssignedName: 'Sharath',
        handoverChecklistCompleted: true,
        meetingWithSalesDone: true,
    }

    it('passes with all criteria met', () => {
        const result = canProgressFromStage2(validStage2)
        expect(result.isValid).toBe(true)
    })
    it('fails without ops SPOC', () => {
        const result = canProgressFromStage2({ ...validStage2, opsSPOCAssignedName: null })
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
    })
    it('fails without handover checklist', () => {
        const result = canProgressFromStage2({ ...validStage2, handoverChecklistCompleted: false })
        expect(result.isValid).toBe(false)
    })
    it('fails without meeting with Sales', () => {
        const result = canProgressFromStage2({ ...validStage2, meetingWithSalesDone: false })
        expect(result.isValid).toBe(false)
    })
})

describe('canProgressFromStage3', () => {
    const validStage3 = {
        confirmActivityAvailability: true,
        confirmFacilitatorsAvailability: true,
        transportationBlocking: true,
        logisticsChecklist: true,
        finalPacking: true,
    }

    it('passes with all criteria met', () => {
        expect(canProgressFromStage3(validStage3).isValid).toBe(true)
    })
    it('fails without activity availability', () => {
        expect(canProgressFromStage3({ ...validStage3, confirmActivityAvailability: false }).isValid).toBe(false)
    })
    it('fails without facilitators availability', () => {
        expect(canProgressFromStage3({ ...validStage3, confirmFacilitatorsAvailability: false }).isValid).toBe(false)
    })
    it('fails without transportation blocking', () => {
        expect(canProgressFromStage3({ ...validStage3, transportationBlocking: false }).isValid).toBe(false)
    })
    it('fails without logistics checklist', () => {
        expect(canProgressFromStage3({ ...validStage3, logisticsChecklist: false }).isValid).toBe(false)
    })
    it('fails without final packing', () => {
        expect(canProgressFromStage3({ ...validStage3, finalPacking: false }).isValid).toBe(false)
    })
})

describe('canProgressFromStage4', () => {
    const validStage4 = {
        participantCount: '50',
        teamActivitiesExecuted: 'Team building activities completed',
    }

    it('passes with all criteria met', () => {
        expect(canProgressFromStage4(validStage4).isValid).toBe(true)
    })
    it('fails without participant count', () => {
        expect(canProgressFromStage4({ ...validStage4, participantCount: null }).isValid).toBe(false)
    })
    it('fails without team activities', () => {
        expect(canProgressFromStage4({ ...validStage4, teamActivitiesExecuted: null }).isValid).toBe(false)
    })
})

describe('canProgressFromStage5', () => {
    const validStage5 = {
        zfdRating: 4,
        zfdComments: '',
        tripExpensesBillsSubmittedToFinance: true,
        opsDataEntryDone: true,
    }

    it('passes with rating > 3 and all criteria', () => {
        expect(canProgressFromStage5(validStage5).isValid).toBe(true)
    })
    it('fails without ZFD rating', () => {
        expect(canProgressFromStage5({ ...validStage5, zfdRating: null }).isValid).toBe(false)
    })
    it('fails with ZFD ≤ 3 and no comments', () => {
        expect(canProgressFromStage5({ ...validStage5, zfdRating: 2, zfdComments: '' }).isValid).toBe(false)
    })
    it('passes with ZFD ≤ 3 and valid comments', () => {
        expect(canProgressFromStage5({ ...validStage5, zfdRating: 2, zfdComments: 'Detailed feedback about issues encountered' }).isValid).toBe(true)
    })
    it('fails without expenses submitted', () => {
        expect(canProgressFromStage5({ ...validStage5, tripExpensesBillsSubmittedToFinance: false }).isValid).toBe(false)
    })
    it('fails without ops data entry', () => {
        expect(canProgressFromStage5({ ...validStage5, opsDataEntryDone: false }).isValid).toBe(false)
    })
})

// ─── VALIDATE STAGE 1 FIELDS ───

describe('validateStage1Fields', () => {
    const validStage1 = {
        programName: 'Team Outing Q4',
        companyName: 'Acme Corp',
        location: 'Coorg',
        clientPOCEmail: 'client@acme.com',
        clientPOCPhone: '9876543210',
        minPax: 20,
        maxPax: 50,
        deliveryBudget: 100000,
        objectives: 'Build team synergy and leadership skills with outdoor activities',
    }

    it('passes with all valid fields', () => {
        const result = validateStage1Fields(validStage1)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
    it('fails without program name', () => {
        expect(validateStage1Fields({ ...validStage1, programName: '' }).isValid).toBe(false)
    })
    it('fails without company name', () => {
        expect(validateStage1Fields({ ...validStage1, companyName: '' }).isValid).toBe(false)
    })
    it('fails without location', () => {
        expect(validateStage1Fields({ ...validStage1, location: '' }).isValid).toBe(false)
    })
    it('fails with invalid email', () => {
        expect(validateStage1Fields({ ...validStage1, clientPOCEmail: 'not-email' }).isValid).toBe(false)
    })
    it('fails with invalid phone', () => {
        expect(validateStage1Fields({ ...validStage1, clientPOCPhone: '12345' }).isValid).toBe(false)
    })
    it('fails with invalid pax range', () => {
        expect(validateStage1Fields({ ...validStage1, minPax: 50, maxPax: 10 }).isValid).toBe(false)
    })
    it('fails without budget', () => {
        expect(validateStage1Fields({ ...validStage1, deliveryBudget: null }).isValid).toBe(false)
    })
    it('fails with short objectives', () => {
        expect(validateStage1Fields({ ...validStage1, objectives: 'Short' }).isValid).toBe(false)
    })
})

// ─── VALIDATE STAGE PROGRESSION ───

describe('validateStageProgression', () => {
    it('delegates to correct stage validator', () => {
        expect(validateStageProgression({ currentStage: 1, financeApprovalReceived: true }).isValid).toBe(true)
        expect(validateStageProgression({ currentStage: 1, financeApprovalReceived: false }).isValid).toBe(false)
    })
    it('returns invalid for unknown stages', () => {
        expect(validateStageProgression({ currentStage: 99 }).isValid).toBe(false)
    })
})

// ─── STAGE NAMES ───

describe('getStageName', () => {
    it('returns correct names for stages 1-6', () => {
        expect(getStageName(1)).toBe('Tentative Handover')
        expect(getStageName(2)).toBe('Accepted Handover')
        expect(getStageName(3)).toBe('Feasibility Check & Preps')
        expect(getStageName(4)).toBe('Delivery')
        expect(getStageName(5)).toBe('Post Trip Closure')
        expect(getStageName(6)).toBe('Done')
    })
    it('falls back for unknown stages', () => {
        expect(getStageName(99)).toBe('Stage 99')
    })
})

describe('STAGE_NAMES', () => {
    it('has entries for all 6 stages', () => {
        expect(Object.keys(STAGE_NAMES)).toHaveLength(6)
    })
})
