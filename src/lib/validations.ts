/**
 * Validation utilities for Trebound Workflow
 * Based on workflow documentation specifications
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
 * STAGE 1 → STAGE 2 EXIT CRITERIA
 * User can only complete Stage 1 (handover) if:
 * - Ops SPOC assigned
 * - Finance approval received (if financeApprovalRequired)
 * - Ops acceptance confirmed
 * - Agenda document uploaded
 */
export const canProgressFromStage1 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // Ops SPOC must be assigned
    if (!program.opsSPOCId) {
        errors.push("Ops SPOC must be assigned before handover");
    }

    // Finance approval (if required)
    if (program.financeApprovalRequired && !program.financeApprovalReceived) {
        errors.push("Finance approval required before handover");
    }

    // Ops acceptance
    if (!program.handoverAcceptedByOps) {
        errors.push("Ops team must accept the program before handover");
    }

    // Agenda document uploaded
    if (!program.agendaDocument) {
        errors.push("Agenda document must be uploaded before handover");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 2 → STAGE 3 EXIT CRITERIA
 * - All resources blocked (checkbox)
 * - Logistics list locked (checkbox)
 * - Prep complete (checkbox)
 * - At least 1 facilitator must be blocked
 */
export const canProgressFromStage2 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // All resources blocked
    if (!program.allResourcesBlocked) {
        errors.push("All resources must be blocked before moving to delivery");
    }

    // Logistics list locked
    if (!program.logisticsListLocked) {
        errors.push("Logistics list must be locked");
    }

    // Prep complete
    if (!program.prepComplete) {
        errors.push("Preparation must be marked as complete");
    }

    // At least one facilitator blocked
    if (!program.facilitatorsBlocked || program.facilitatorsBlocked.trim() === '') {
        errors.push("At least one facilitator must be assigned and blocked");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 3 → STAGE 4 EXIT CRITERIA
 * - Trip expense sheet uploaded (MANDATORY)
 * - Packing checklist complete
 * - Program completed (checkbox)
 */
export const canProgressFromStage3 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // Trip expense sheet is mandatory
    if (!program.tripExpenseSheet) {
        errors.push("Trip expense sheet must be uploaded before closing delivery");
    }

    // Packing checklist done
    if (!program.packingCheckDone) {
        errors.push("Packing checklist must be marked as complete");
    }

    // Program completed
    if (!program.programCompleted) {
        errors.push("Program must be marked as completed");
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * STAGE 4 → STAGE 5 EXIT CRITERIA
 * - ZFD rating filled (1-5, MANDATORY)
 * - ZFD comments if rating ≤ 3 (minimum 10 characters)
 * - Expenses & bills submitted (checkbox)
 * - Ops data manager updated (checkbox)
 */
export const canProgressFromStage4 = (program: any): ValidationResult => {
    const errors: string[] = [];

    // ZFD rating required
    if (program.zfdRating === null || program.zfdRating === undefined) {
        errors.push("ZFD rating is required (1-5)");
    } else if (!isValidZFDRating(program.zfdRating)) {
        errors.push("ZFD rating must be between 1 and 5");
    } else if (program.zfdRating <= 3 && (!program.zfdComments || program.zfdComments.length < 10)) {
        errors.push("Comments mandatory for ratings ≤3 (minimum 10 characters)");
    }

    // Expenses submitted
    if (!program.expensesBillsSubmitted) {
        errors.push("Expenses and bills must be submitted");
    }

    // Ops data manager updated
    if (!program.opsDataManagerUpdated) {
        errors.push("Ops data manager must be updated");
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
        default:
            return { isValid: false, errors: ["Invalid stage"] };
    }
};
