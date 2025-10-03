USE PlantDiseasesDB
GO


-- Diseases table (maps to your ML model classes)
CREATE TABLE diseases (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL UNIQUE,
    scientific_name NVARCHAR(255),
    plant_type NVARCHAR(100) NOT NULL, -- corn, potato, tomato
    severity_level NVARCHAR(50), -- mild, moderate, severe
    description NTEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Symptoms table
CREATE TABLE symptoms (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NTEXT,
    symptom_type NVARCHAR(100), -- visual, physical, growth
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Remedies table
CREATE TABLE remedies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    type NVARCHAR(100), -- chemical, organic, cultural, biological
    description NTEXT,
    application_method NTEXT,
    safety_notes NTEXT,
    effectiveness_rating INT CHECK(effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    cost_level NVARCHAR(50), -- low, medium, high
    created_at DATETIME2 DEFAULT GETDATE()
);
GO

-- Many-to-many: Disease-Symptoms relationship
CREATE TABLE disease_symptoms (
    disease_id INT NOT NULL,
    symptom_id INT NOT NULL,
    severity NVARCHAR(50), -- how severe this symptom is for this disease
    frequency NVARCHAR(50), -- how common this symptom is
    PRIMARY KEY (disease_id, symptom_id),
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE,
    FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
);
GO

-- Many-to-many: Disease-Remedies relationship
CREATE TABLE disease_remedies (
    disease_id INT NOT NULL,
    remedy_id INT NOT NULL,
    effectiveness INT CHECK(effectiveness >= 1 AND effectiveness <= 5),
    application_timing NVARCHAR(255), -- early_stage, any_stage, prevention
    notes NTEXT,
    PRIMARY KEY (disease_id, remedy_id),
    FOREIGN KEY (disease_id) REFERENCES diseases(id) ON DELETE CASCADE,
    FOREIGN KEY (remedy_id) REFERENCES remedies(id) ON DELETE CASCADE
);
GO

-- Create indexes for better performance
CREATE INDEX IX_diseases_plant_type ON diseases(plant_type);
CREATE INDEX IX_diseases_name ON diseases(name);
CREATE INDEX IX_symptoms_type ON symptoms(symptom_type);
CREATE INDEX IX_remedies_type ON remedies(type);
GO