/* connecting to "PlantDiseasesDB" database... */
/****** Object:  Table [dbo].[disease_remedies]    Script Date: 10/10/2025 8:42:35 AM ******/
CREATE TABLE disease_remedies(
	disease_id int NOT NULL,
	remedy_id int NOT NULL,
	effectiveness int NULL,
	application_timing VARCHAR(255) NULL,
	notes TEXT NULL,
PRIMARY KEY 
(
	disease_id,
	remedy_id
)
);
/****** Object:  Table [dbo].[disease_symptoms]    Script Date: 10/10/2025 8:42:35 AM ******/
CREATE TABLE disease_symptoms(
	disease_id int NOT NULL,
	symptom_id int NOT NULL,
	severity VARCHAR(50) NULL,
	frequency VARCHAR(50) NULL,
PRIMARY KEY 
(
	disease_id,
	symptom_id
)
);
/****** Object:  Table [dbo].[diseases]    Script Date: 10/10/2025 8:42:35 AM ******/
CREATE TABLE diseases(
	id int GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	scientific_name VARCHAR(255) NULL,
	plant_type VARCHAR(100) NOT NULL,
	severity_level VARCHAR(50) NULL,
	description TEXT NULL,
	created_at TIMESTAMP(6) NULL,
	updated_at TIMESTAMP(6) NULL,
PRIMARY KEY 
(
	id
)
);
/****** Object:  Table [dbo].[remedies]    Script Date: 10/10/2025 8:42:35 AM ******/
CREATE TABLE remedies(
	id int GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	"type" VARCHAR(100) NULL,
	description TEXT NULL,
	application_method TEXT NULL,
	safety_notes TEXT NULL,
	effectiveness_rating int NULL,
	cost_level VARCHAR(50) NULL,
	created_at TIMESTAMP(6) NULL,
PRIMARY KEY 
(
	id
)
);
/****** Object:  Table [dbo].[symptoms]    Script Date: 10/10/2025 8:42:35 AM ******/
CREATE TABLE symptoms(
	id int GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) NOT NULL,
	"name" VARCHAR(255) NOT NULL,
	description TEXT NULL,
	symptom_type VARCHAR(100) NULL,
	created_at TIMESTAMP(6) NULL,
PRIMARY KEY 
(
	id
)
);
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (2, 1, 4, 'early_stage', 'Apply at first sign of symptoms');
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (2, 4, 5, 'prevention', 'Best long-term solution');
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (9, 3, 5, 'prevention', 'Rotate with non-solanaceous crops');
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (9, 6, 4, 'early_stage', 'Very effective if applied early');
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (10, 1, 4, 'prevention', 'Apply preventively in humid conditions');
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES (10, 10, 5, 'any_stage', 'Critical to prevent spread');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (2, 2, 'medium', 'common');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (2, 3, 'high', 'always');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (9, 1, 'high', 'always');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (9, 5, 'high', 'always');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (10, 4, 'high', 'always');
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES (10, 7, 'high', 'common'); 

INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Corn Cercospora leaf spot Gray leaf spot', 'Cercospora zeae-maydis', 'corn', 'moderate', 'Fungal disease causing gray leaf spots with yellow halos', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Corn Common_rust_', 'Puccinia sorghi', 'corn', 'moderate', 'Fungal disease causing rust-colored pustules on corn leaves', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Corn_(maize)___Northern_Leaf_Blight', 'Exserohilum turcicum', 'corn', 'severe', 'Fungal disease causing large, elliptical lesions on leaves', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (4, 'Corn_(maize)___healthy', NULL, 'corn', 'none', 'Healthy corn plant with no disease symptoms', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (5, 'Potato___Early_blight', 'Alternaria solani', 'potato', 'moderate', 'Fungal disease causing dark spots with concentric rings', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (6, 'Potato___Late_blight', 'Phytophthora infestans', 'potato', 'severe', 'Devastating disease that caused the Irish Potato Famine', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (7, 'Potato___healthy', NULL, 'potato', 'none', 'Healthy potato plant with no disease symptoms', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (8, 'Tomato___Bacterial_spot', 'Xanthomonas spp.', 'tomato', 'moderate', 'Bacterial disease causing small, dark spots on leaves and fruit', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (9, 'Tomato___Early_blight', 'Alternaria solani', 'tomato', 'moderate', 'Fungal disease causing target-like spots on leaves', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (10, 'Tomato___Late_blight', 'Phytophthora infestans', 'tomato', 'severe', 'Highly destructive disease affecting leaves, stems, and fruit', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (11, 'Tomato___Leaf_Mold', 'Passalora fulva', 'tomato', 'mild', 'Fungal disease causing yellow spots that turn brown', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (12, 'Tomato___Septoria_leaf_spot', 'Septoria lycopersici', 'tomato', 'moderate', 'Fungal disease causing small, circular spots with dark borders', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (13, 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tetranychus urticae', 'tomato', 'mild', 'Pest causing stippling and webbing on leaves', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (14, 'Tomato___Target_Spot', 'Corynespora cassiicola', 'tomato', 'moderate', 'Fungal disease causing target-like lesions', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (15, 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'TYLCV', 'tomato', 'severe', 'Viral disease causing leaf curling and yellowing', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (16, 'Tomato___Tomato_mosaic_virus', 'ToMV', 'tomato', 'moderate', 'Viral disease causing mosaic patterns on leaves', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP));
INSERT INTO diseases (id, "name", scientific_name, plant_type, severity_level, description, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (17, 'Tomato___healthy', NULL, 'tomato', 'none', 'Healthy tomato plant with no disease symptoms', CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP), CAST('2025-10-02T13:24:49.0366667' AS TIMESTAMP)); 

INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Copper fungicide', 'chemical', 'Copper-based fungicide for bacterial and fungal diseases', 'Spray every 7-14 days as needed', 'Wear protective equipment. Do not apply before rain.', 4, 'medium', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Neem oil', 'organic', 'Natural oil extract for pest and disease control', 'Spray in early morning or evening', 'Generally safe but may cause leaf burn in hot weather', 3, 'low', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Crop rotation', 'cultural', 'Rotate crops to break disease cycles', 'Plant different crop families in sequence', 'No safety concerns', 5, 'low', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (4, 'Resistant varieties', 'cultural', 'Plant disease-resistant cultivars', 'Choose certified resistant seeds/plants', 'No safety concerns', 5, 'medium', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (5, 'Bacillus subtilis', 'biological', 'Beneficial bacteria for disease suppression', 'Apply as soil drench or foliar spray', 'Safe for humans and beneficial insects', 4, 'medium', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (6, 'Chlorothalonil', 'chemical', 'Broad-spectrum fungicide', 'Apply according to label directions', 'Highly toxic. Use full protective equipment.', 4, 'high', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (7, 'Proper spacing', 'cultural', 'Increase air circulation between plants', 'Follow recommended plant spacing', 'No safety concerns', 3, 'low', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (8, 'Drip irrigation', 'cultural', 'Avoid overhead watering to reduce disease spread', 'Water at soil level', 'No safety concerns', 3, 'medium', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (9, 'Insecticidal soap', 'organic', 'Soap-based spray for soft-bodied insects', 'Spray directly on pests', 'Safe for humans and pets', 3, 'low', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP));
INSERT INTO remedies (id, "name", "type", description, application_method, safety_notes, effectiveness_rating, cost_level, created_at) OVERRIDING SYSTEM VALUE VALUES (10, 'Remove infected plants', 'cultural', 'Physical removal of diseased plant material', 'Remove and destroy infected plants immediately', 'Wash hands and tools after handling', 4, 'low', CAST('2025-10-02T13:24:49.0600000' AS TIMESTAMP)); 

INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Leaf spots', 'Circular or irregular spots on leaf surface', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Yellowing leaves', 'Progressive yellowing of foliage', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Rust pustules', 'Orange-brown raised spots on leaves', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (4, 'Leaf blight', 'Large dead areas on leaves', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (5, 'Concentric rings', 'Target-like patterns in leaf spots', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (6, 'Stunted growth', 'Reduced plant height and vigor', 'physical', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (7, 'Wilting', 'Loss of plant turgor and drooping', 'physical', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (8, 'Fruit spots', 'Lesions or discoloration on fruit', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (9, 'Leaf curling', 'Upward or downward curling of leaves', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (10, 'Mosaic pattern', 'Light and dark green patches on leaves', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (11, 'Webbing', 'Fine spider webs on plant surfaces', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
INSERT INTO symptoms (id, "name", description, symptom_type, created_at) OVERRIDING SYSTEM VALUE VALUES (12, 'Stippling', 'Small white or yellow dots on leaves', 'visual', CAST('2025-10-02T13:24:49.0500000' AS TIMESTAMP));
/****** Object:  Index [UQ__diseases__72E12F1B77A6855B]    Script Date: 10/10/2025 8:42:35 AM ******/
ALTER TABLE diseases ADD UNIQUE 
(
	"name"
);
ALTER TABLE diseases ALTER COLUMN created_at SET DEFAULT (NOW());
ALTER TABLE diseases ALTER COLUMN updated_at SET DEFAULT (NOW());
ALTER TABLE remedies ALTER COLUMN created_at SET DEFAULT (NOW());
ALTER TABLE symptoms ALTER COLUMN created_at SET DEFAULT (NOW());
ALTER TABLE disease_remedies  ADD FOREIGN KEY(disease_id)
REFERENCES diseases (id)
ON DELETE CASCADE;
ALTER TABLE disease_remedies  ADD FOREIGN KEY(remedy_id)
REFERENCES remedies (id)
ON DELETE CASCADE;
ALTER TABLE disease_symptoms  ADD FOREIGN KEY(disease_id)
REFERENCES diseases (id)
ON DELETE CASCADE;
ALTER TABLE disease_symptoms  ADD FOREIGN KEY(symptom_id)
REFERENCES symptoms (id)
ON DELETE CASCADE;
ALTER TABLE disease_remedies  ADD CHECK  ((effectiveness>=(1) AND effectiveness<=(5)));
ALTER TABLE remedies  ADD CHECK  ((effectiveness_rating>=(1) AND effectiveness_rating<=(5)));

select * from diseases;
