/**
 * Validation utilities for Trebound Workflow
 * Updated for 6-stage pipeline:
 *   1: Tentative Handover
 *   2: Accepted Handover
 *   3: Feasibility Check & Preps
 *   4: Delivery
 *   5: Post Trip Closure
 *   6: Done
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Indian phone number validation (10 digits starting with 6-9)
export const isValidIndianPhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Date validation - no past dates
export const isValidProgramDate = (date: string | Date): boolean => {
    const programDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return programDate >= today;
};

// Pax range validation
export const isValidPaxRange = (minPax: number, maxPax: number): boolean => {
    return minPax > 0 && minPax <= maxPax;
};

// Budget validation
export const isValidBudget = (budget: number): boolean => {
    return budget > 0;
};

// File size validation (10MB limit)
export const isValidFileSize = (sizeInBytes: number): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return sizeInBytes <= maxSize;
};

// Document file type validation
export const isValidDocumentType = (filename: string): boolean => {
    const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(extension || '');
};

// Media file type validation
export const isValidMediaType = (filename: string): boolean => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'mp4', 'mov', 'avi', 'wmv', 'webm'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(extension || '');
};

// ZFD rating validation
export const isValidZFDRating = (rating: number): boolean => {
    return rating >= 1 && rating <= 5;
};

// ZFD comments validation (mandatory if rating ≤ 3)
export const areZFDCommentsRequired = (rating: number, comments?: string): boolean => {
    if (rating > 3) return true; // Comments not required
    return !!(comments && comments.length >= 10);
};

// Combined validation with error messages
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * STAGE 1 → STAGE 2 EXIT CRITERIA  (Tentative Handover → Accepted Handover)
 * Triggered when Finance approves budget. Requirements:
 * - Finance approval received
 * Note: Agenda document is optional at this stage
 * Note: Ops SPOC is no longer required before Finance approval
 */
export const canProgressFromStage1 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // Finance approval required
    if (!program.financeApprovalReceived) {
        errors.push("Finance approval required before moving to Accepted Handover");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 2 → STAGE 3 EXIT CRITERIA  (Accepted Handover → Feasibility Check & Preps)
 * - Ops SPOC assigned (dropdown selection)
 * - Handover checklist completed
 * - Meeting with Sales POC done
 * - Handover accepted by Ops
 */
export const canProgressFromStage2 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // Ops SPOC must be assigned
    if (!program.opsSPOCAssignedName) {
        errors.push("Ops SPOC must be assigned (select from dropdown)");
    }

    // Handover checklist must be completed
    if (!program.handoverChecklistCompleted) {
        errors.push("Handover acceptance checklist must be completed");
    }

    // Meeting with Sales POC
    if (!program.meetingWithSalesDone) {
        errors.push("Meeting with Sales POC must be completed (call & understand deliverables)");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 3 → STAGE 4 EXIT CRITERIA  (Feasibility Check & Preps → Delivery)
 * Key items that must be confirmed before delivery:
 * - Activity availability confirmed
 * - Facilitators availability confirmed
 * - Transportation blocking done
 * - Final packing done
 * - Logistics checklist done
 */
export const canProgressFromStage3 = (program: any): ValidationResult => {
    const errors: string[] = [];

    if (!program.confirmActivityAvailability) {
        errors.push("Activity availability must be confirmed");
    }

    if (!program.confirmFacilitatorsAvailability) {
        errors.push("Facilitators availability must be confirmed & blocked");
    }

    if (!program.transportationBlocking) {
        errors.push("Transportation must be blocked");
    }

    if (!program.logisticsChecklist) {
        errors.push("Logistics checklist must be completed");
    }

    if (!program.finalPacking) {
        errors.push("Final packing must be completed");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 4 → STAGE 5 EXIT CRITERIA  (Delivery → Post Trip Closure)
 * - Trip expense submitted
 * - Participant count filled
 * - Team activities listed
 */
export const canProgressFromStage4 = (program: any): ValidationResult => {
    const errors: string[] = [];

    if (!program.participantCount) {
        errors.push("Number of participants must be filled");
    }

    if (!program.teamActivitiesExecuted) {
        errors.push("Team activities executed must be documented");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 5 → STAGE 6 EXIT CRITERIA  (Post Trip Closure → Done)
 * - ZFD rating filled (1-5, MANDATORY)
 * - ZFD comments if rating ≤ 3 (minimum 10 characters)
 * - Expenses/bills submitted to finance
 * - Ops data entry done
 */
export const canProgressFromStage5 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // ZFD rating required
    if (program.zfdRating === null || program.zfdRating === undefined) {
        errors.push("ZFD rating is required (1-5)");
    } else if (!isValidZFDRating(program.zfdRating)) {
        errors.push("ZFD rating must be between 1 and 5");
    } else if (program.zfdRating <= 3 && (!program.zfdComments || program.zfdComments.length < 10)) {
        errors.push("Comments mandatory for ratings ≤3 (minimum 10 characters)");
    }

    // Expenses submitted to finance
    if (!program.tripExpensesBillsSubmittedToFinance) {
        errors.push("Expenses and bills must be submitted to Finance");
    }

    // Ops data entry
    if (!program.opsDataEntryDone) {
        errors.push("Ops data entry must be completed");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * General field-level validations for Stage 1
 */
export const validateStage1Fields = (data: any): ValidationResult => {
    const errors: string[] = [];

    // Required fields
    if (!data.programName || data.programName.trim() === '') {
        errors.push('Program name is required');
    }

    if (!data.companyName || data.companyName.trim() === '') {
        errors.push('Company name is required');
    }

    if (!data.location || data.location.trim() === '') {
        errors.push('Location is required');
    }

    // Email validation
    if (data.clientPOCEmail && !isValidEmail(data.clientPOCEmail)) {
        errors.push('Invalid email format');
    } else if (!data.clientPOCEmail) {
        errors.push('Client POC email is required');
    }

    // Phone validation
    if (data.clientPOCPhone && !isValidIndianPhone(data.clientPOCPhone)) {
        errors.push('Invalid Indian phone number (10 digits starting with 6-9)');
    } else if (!data.clientPOCPhone) {
        errors.push('Client POC phone is required');
    }

    // Pax range validation
    if (data.minPax && data.maxPax && !isValidPaxRange(data.minPax, data.maxPax)) {
        errors.push('Min pax must be positive and not exceed max pax');
    }

    // Budget validation
    if (data.deliveryBudget && !isValidBudget(data.deliveryBudget)) {
        errors.push('Budget must be a positive number');
    } else if (!data.deliveryBudget) {
        errors.push('Delivery budget is required');
    }

    // Objectives required
    if (!data.objectives || data.objectives.length < 10) {
        errors.push('Objectives required (minimum 10 characters)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Stage name lookup
 */
export const STAGE_NAMES: Record<number, string> = {
    1: "Tentative Handover",
    2: "Accepted Handover",
    3: "Feasibility Check & Preps",
    4: "Delivery",
    5: "Post Trip Closure",
    6: "Done",
};

export const getStageName = (stage: number): string => {
    return STAGE_NAMES[stage] || `Stage ${stage}`;
};

/**
 * Helper function to validate all exit criteria based on current stage
 */
export const validateStageProgression = (program: any): ValidationResult => {
    switch (program.currentStage) {
        case 1:
            return canProgressFromStage1(program);
        case 2:
            return canProgressFromStage2(program);
        case 3:
            return canProgressFromStage3(program);
        case 4:
            return canProgressFromStage4(program);
        case 5:
            return canProgressFromStage5(program);
        default:
            return { isValid: false, errors: ["Invalid stage"] };
    }
};
