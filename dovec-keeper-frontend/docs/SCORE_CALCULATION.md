# Score Calculation Documentation

## 📊 Overview

All scores are calculated **on-the-fly** from survey responses. The calculation happens in the backend when you call `/api/results` or `/api/results/:employeeId`.

## 🔄 Calculation Process

### Step 1: Categorize Questions

For each question in a survey response, the system categorizes it based on:
- **Question Type** (if specified): `kpi`, `potential`, etc.
- **Question Text** (keywords): Searches for specific words in the question text

### Step 2: Calculate Category Averages

For each category, the system:
1. Finds all questions that match that category
2. Sums up the answer values
3. Divides by the count of matching questions

```javascript
// Example: KPI Score
totalKPI = sum of all KPI question answers
kpiCount = number of KPI questions
kpiScore = totalKPI / kpiCount
```

## 📈 Score Categories

### 1. **KPI Score**
- **How it's calculated**: Average of all questions with type `"kpi"` or containing "kpi" in the text
- **Formula**: `Sum of KPI answers / Number of KPI questions`

### 2. **Potential**
- **How it's calculated**: Average of all questions with type `"potential"` or containing "potential" in the text
- **Formula**: `Sum of Potential answers / Number of Potential questions`

### 3. **Culture Harmony**
- **How it's calculated**: Average of all questions containing "culture" or "harmony" in the text
- **Formula**: `Sum of Culture answers / Number of Culture questions`

### 4. **Team Effect**
- **How it's calculated**: Average of all questions containing "team" or "collaboration" in the text
- **Formula**: `Sum of Team answers / Number of Team questions`

### 5. **Executive Observation**
- **How it's calculated**: Average of all questions containing "executive" or "observation" in the text
- **Formula**: `Sum of Executive answers / Number of Executive questions`

### 6. **Performance Score**
- **How it's calculated**: Average of all questions containing "performance" in the text
- **Formula**: `Sum of Performance answers / Number of Performance questions`

### 7. **Contribution Score**
- **How it's calculated**: Average of all questions containing "contribution" in the text
- **Formula**: `Sum of Contribution answers / Number of Contribution questions`

### 8. **Potential Score**
- **How it's calculated**: Same as "Potential" (currently a duplicate)
- **Formula**: `potentialScore = potential`

### 9. **Keeper Score** ⭐ (Most Important)
- **How it's calculated**: **Weighted average** of key metrics
- **Formula**:
  ```
  Keeper Score = 
    (Performance Score × 0.3) +
    (Contribution Score × 0.3) +
    (Potential Score × 0.2) +
    (Culture Harmony × 0.1) +
    (Team Effect × 0.1)
  ```
- **Weights**:
  - Performance: **30%**
  - Contribution: **30%**
  - Potential: **20%**
  - Culture Harmony: **10%**
  - Team Effect: **10%**

## 🔢 Aggregation Across Multiple Surveys

When an employee has submitted **multiple surveys**, the system:

1. **Calculates scores for each survey separately**
2. **Averages the scores** across all surveys

```javascript
// Example: Employee has 3 surveys
Survey 1: keeperScore = 4.5
Survey 2: keeperScore = 4.8
Survey 3: keeperScore = 4.2

Final Keeper Score = (4.5 + 4.8 + 4.2) / 3 = 4.5
```

## 📝 Code Implementation

### Location
`dovec-keeper-backend/src/routes/results.ts`

### Key Function
```javascript
function calculateScores(answers: any[], questions: any[]) {
  // 1. Map questions and answers
  // 2. Categorize questions by type/text
  // 3. Calculate averages for each category
  // 4. Calculate weighted Keeper Score
  // 5. Return all scores
}
```

### Question Categorization Logic

```javascript
// KPI Questions
if (questionType === "kpi" || questionText.includes("kpi")) {
  totalKPI += answerValue;
  kpiCount++;
}

// Potential Questions
if (questionType === "potential" || questionText.includes("potential")) {
  totalPotential += answerValue;
  potentialCount++;
}

// Culture Questions
if (questionText.includes("culture") || questionText.includes("harmony")) {
  totalCulture += answerValue;
  cultureCount++;
}

// Team Questions
if (questionText.includes("team") || questionText.includes("collaboration")) {
  totalTeam += answerValue;
  teamCount++;
}

// Executive Questions
if (questionText.includes("executive") || questionText.includes("observation")) {
  totalExecutive += answerValue;
  executiveCount++;
}

// Performance Questions
if (questionText.includes("performance")) {
  totalPerformance += answerValue;
  performanceCount++;
}

// Contribution Questions
if (questionText.includes("contribution")) {
  totalContribution += answerValue;
  contributionCount++;
}
```

## 🎯 Example Calculation

### Sample Survey Response

**Questions:**
1. "What is the employee's KPI performance?" (Type: "kpi") → Answer: 85
2. "Rate their potential for growth" (Type: "potential") → Answer: 90
3. "How well do they fit the company culture?" → Answer: 88
4. "Team collaboration skills" → Answer: 87
5. "Overall performance rating" → Answer: 92
6. "Contribution to team goals" → Answer: 89

### Calculation:

```
KPI Score = 85 / 1 = 85.0
Potential = 90 / 1 = 90.0
Culture Harmony = 88 / 1 = 88.0
Team Effect = 87 / 1 = 87.0
Performance Score = 92 / 1 = 92.0
Contribution Score = 89 / 1 = 89.0
Potential Score = 90.0 (same as Potential)

Keeper Score = 
  (92.0 × 0.3) +  // Performance
  (89.0 × 0.3) +  // Contribution
  (90.0 × 0.2) +  // Potential
  (88.0 × 0.1) +  // Culture
  (87.0 × 0.1)    // Team
= 27.6 + 26.7 + 18.0 + 8.8 + 8.7
= 89.8
```

## ⚠️ Important Notes

1. **Case Insensitive**: All text matching is case-insensitive
2. **Partial Matching**: Questions are categorized if they contain keywords anywhere in the text
3. **Missing Answers**: Questions without answers are skipped
4. **No Questions in Category**: If no questions match a category, the score is `0`
5. **Multiple Surveys**: Scores are averaged across all submitted surveys
6. **Real-time**: Scores are calculated every time you request results (not stored)

## 🔍 How to Verify Calculations

1. **Check Question Text**: Make sure your survey questions contain the right keywords
2. **Check Answer Values**: Verify that answers are numeric values
3. **Check Question Types**: Set `type` field on questions for explicit categorization
4. **Test with Sample Data**: Use the verification script:
   ```bash
   node scripts/verify-data-flow.js
   ```

## 📊 Display in Frontend

- **Results Page**: Shows all employees with their calculated scores
- **User Details Page**: Shows aggregated scores for a specific employee
- **Survey Filter**: Can filter results by specific survey

## 🛠️ Customization

To change the calculation logic:

1. Edit `dovec-keeper-backend/src/routes/results.ts`
2. Modify the `calculateScores()` function
3. Adjust the Keeper Score weights in the formula
4. Add new categories by adding new if-statements

