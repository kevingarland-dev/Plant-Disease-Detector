USE PlantDiseasesDB;
GO

-- Insert sample diseases (matching your ML model classes)
INSERT INTO diseases (name, scientific_name, plant_type, severity_level, description) VALUES
('Corn Cercospora leaf spot Gray leaf spot', 'Cercospora zeae-maydis', 'corn', 'moderate', 'Fungal disease causing gray leaf spots with yellow halos'),
('Corn Common_rust_', 'Puccinia sorghi', 'corn', 'moderate', 'Fungal disease causing rust-colored pustules on corn leaves'),
('Corn_(maize)___Northern_Leaf_Blight', 'Exserohilum turcicum', 'corn', 'severe', 'Fungal disease causing large, elliptical lesions on leaves'),
('Corn_(maize)___healthy', NULL, 'corn', 'none', 'Healthy corn plant with no disease symptoms'),
('Potato___Early_blight', 'Alternaria solani', 'potato', 'moderate', 'Fungal disease causing dark spots with concentric rings'),
('Potato___Late_blight', 'Phytophthora infestans', 'potato', 'severe', 'Devastating disease that caused the Irish Potato Famine'),
('Potato___healthy', NULL, 'potato', 'none', 'Healthy potato plant with no disease symptoms'),
('Tomato___Bacterial_spot', 'Xanthomonas spp.', 'tomato', 'moderate', 'Bacterial disease causing small, dark spots on leaves and fruit'),
('Tomato___Early_blight', 'Alternaria solani', 'tomato', 'moderate', 'Fungal disease causing target-like spots on leaves'),
('Tomato___Late_blight', 'Phytophthora infestans', 'tomato', 'severe', 'Highly destructive disease affecting leaves, stems, and fruit'),
('Tomato___Leaf_Mold', 'Passalora fulva', 'tomato', 'mild', 'Fungal disease causing yellow spots that turn brown'),
('Tomato___Septoria_leaf_spot', 'Septoria lycopersici', 'tomato', 'moderate', 'Fungal disease causing small, circular spots with dark borders'),
('Tomato___Spider_mites Two-spotted_spider_mite', 'Tetranychus urticae', 'tomato', 'mild', 'Pest causing stippling and webbing on leaves'),
('Tomato___Target_Spot', 'Corynespora cassiicola', 'tomato', 'moderate', 'Fungal disease causing target-like lesions'),
('Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'TYLCV', 'tomato', 'severe', 'Viral disease causing leaf curling and yellowing'),
('Tomato___Tomato_mosaic_virus', 'ToMV', 'tomato', 'moderate', 'Viral disease causing mosaic patterns on leaves'),
('Tomato___healthy', NULL, 'tomato', 'none', 'Healthy tomato plant with no disease symptoms');
GO

-- Insert sample symptoms
INSERT INTO symptoms (name, description, symptom_type) VALUES
('Leaf spots', 'Circular or irregular spots on leaf surface', 'visual'),
('Yellowing leaves', 'Progressive yellowing of foliage', 'visual'),
('Rust pustules', 'Orange-brown raised spots on leaves', 'visual'),
('Leaf blight', 'Large dead areas on leaves', 'visual'),
('Concentric rings', 'Target-like patterns in leaf spots', 'visual'),
('Stunted growth', 'Reduced plant height and vigor', 'physical'),
('Wilting', 'Loss of plant turgor and drooping', 'physical'),
('Fruit spots', 'Lesions or discoloration on fruit', 'visual'),
('Leaf curling', 'Upward or downward curling of leaves', 'visual'),
('Mosaic pattern', 'Light and dark green patches on leaves', 'visual'),
('Webbing', 'Fine spider webs on plant surfaces', 'visual'),
('Stippling', 'Small white or yellow dots on leaves', 'visual');
GO

-- Insert sample remedies
INSERT INTO remedies (name, type, description, application_method, safety_notes, effectiveness_rating, cost_level) VALUES
('Copper fungicide', 'chemical', 'Copper-based fungicide for bacterial and fungal diseases', 'Spray every 7-14 days as needed', 'Wear protective equipment. Do not apply before rain.', 4, 'medium'),
('Neem oil', 'organic', 'Natural oil extract for pest and disease control', 'Spray in early morning or evening', 'Generally safe but may cause leaf burn in hot weather', 3, 'low'),
('Crop rotation', 'cultural', 'Rotate crops to break disease cycles', 'Plant different crop families in sequence', 'No safety concerns', 5, 'low'),
('Resistant varieties', 'cultural', 'Plant disease-resistant cultivars', 'Choose certified resistant seeds/plants', 'No safety concerns', 5, 'medium'),
('Bacillus subtilis', 'biological', 'Beneficial bacteria for disease suppression', 'Apply as soil drench or foliar spray', 'Safe for humans and beneficial insects', 4, 'medium'),
('Chlorothalonil', 'chemical', 'Broad-spectrum fungicide', 'Apply according to label directions', 'Highly toxic. Use full protective equipment.', 4, 'high'),
('Proper spacing', 'cultural', 'Increase air circulation between plants', 'Follow recommended plant spacing', 'No safety concerns', 3, 'low'),
('Drip irrigation', 'cultural', 'Avoid overhead watering to reduce disease spread', 'Water at soil level', 'No safety concerns', 3, 'medium'),
('Insecticidal soap', 'organic', 'Soap-based spray for soft-bodied insects', 'Spray directly on pests', 'Safe for humans and pets', 3, 'low'),
('Remove infected plants', 'cultural', 'Physical removal of diseased plant material', 'Remove and destroy infected plants immediately', 'Wash hands and tools after handling', 4, 'low');
GO

-- Create relationships between diseases and symptoms
-- Corn Common Rust
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES
((SELECT id FROM diseases WHERE name = 'Corn Common_rust_'), (SELECT id FROM symptoms WHERE name = 'Rust pustules'), 'high', 'always'),
((SELECT id FROM diseases WHERE name = 'Corn Common_rust_'), (SELECT id FROM symptoms WHERE name = 'Yellowing leaves'), 'medium', 'common');

-- Tomato Early Blight
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES
((SELECT id FROM diseases WHERE name = 'Tomato___Early_blight'), (SELECT id FROM symptoms WHERE name = 'Leaf spots'), 'high', 'always'),
((SELECT id FROM diseases WHERE name = 'Tomato___Early_blight'), (SELECT id FROM symptoms WHERE name = 'Concentric rings'), 'high', 'always');

-- Tomato Late Blight
INSERT INTO disease_symptoms (disease_id, symptom_id, severity, frequency) VALUES
((SELECT id FROM diseases WHERE name = 'Tomato___Late_blight'), (SELECT id FROM symptoms WHERE name = 'Leaf blight'), 'high', 'always'),
((SELECT id FROM diseases WHERE name = 'Tomato___Late_blight'), (SELECT id FROM symptoms WHERE name = 'Wilting'), 'high', 'common');

-- Add more symptom relationships as needed...

-- Create relationships between diseases and remedies
-- Corn Common Rust remedies
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES
((SELECT id FROM diseases WHERE name = 'Corn Common_rust_'), (SELECT id FROM remedies WHERE name = 'Resistant varieties'), 5, 'prevention', 'Best long-term solution'),
((SELECT id FROM diseases WHERE name = 'Corn Common_rust_'), (SELECT id FROM remedies WHERE name = 'Copper fungicide'), 4, 'early_stage', 'Apply at first sign of symptoms');

-- Tomato Early Blight remedies
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES
((SELECT id FROM diseases WHERE name = 'Tomato___Early_blight'), (SELECT id FROM remedies WHERE name = 'Chlorothalonil'), 4, 'early_stage', 'Very effective if applied early'),
((SELECT id FROM diseases WHERE name = 'Tomato___Early_blight'), (SELECT id FROM remedies WHERE name = 'Crop rotation'), 5, 'prevention', 'Rotate with non-solanaceous crops');

-- Tomato Late Blight remedies
INSERT INTO disease_remedies (disease_id, remedy_id, effectiveness, application_timing, notes) VALUES
((SELECT id FROM diseases WHERE name = 'Tomato___Late_blight'), (SELECT id FROM remedies WHERE name = 'Copper fungicide'), 4, 'prevention', 'Apply preventively in humid conditions'),
((SELECT id FROM diseases WHERE name = 'Tomato___Late_blight'), (SELECT id FROM remedies WHERE name = 'Remove infected plants'), 5, 'any_stage', 'Critical to prevent spread');

GO

-- Verify the data
SELECT 'Diseases' as TableName, COUNT(*) as RecordCount FROM diseases
UNION ALL
SELECT 'Symptoms', COUNT(*) FROM symptoms
UNION ALL
SELECT 'Remedies', COUNT(*) FROM remedies
UNION ALL
SELECT 'Disease-Symptom Links', COUNT(*) FROM disease_symptoms
UNION ALL
SELECT 'Disease-Remedy Links', COUNT(*) FROM disease_remedies;
GO

PRINT 'Sample data inserted successfully!';