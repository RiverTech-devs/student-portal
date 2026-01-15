-- Remap old question IDs to new question IDs for Q2 Chemistry Final
-- The test was recreated with new question IDs, but submissions have old IDs

-- This mapping was created by matching answer content to question text
-- Write-in questions matched by content, MC questions matched by order

DO $$
DECLARE
    sub RECORD;
    old_answers JSONB;
    new_answers JSONB;
    mapping JSONB := '{
        "c52f544f-a212-4f27-a5d5-57b6a368f281": "789f9a51-1950-40c1-8a38-f4c418c5bfb5",
        "9c938ecf-2447-47dd-9180-ac4ce5c78fc2": "60265e4a-6c6e-4ce6-8311-9a57a1c1654a",
        "9a2a67bb-393a-4c4a-9af2-d02f94a23d95": "7724f879-4e02-4be3-82a7-11e863f03dba",
        "812ec542-3a57-429c-93a6-90211ac5b9b3": "4e4d3cdf-be49-4784-aadc-8d82eaf3e26c",
        "0f1b28f4-4b19-465f-9d65-981feb602526": "846af5e8-0df9-42ee-bbf2-e2838cc33425",
        "afaa3a0e-1a4f-488c-b245-92865c2d6c46": "390fc6f3-c66b-4cb2-8b37-0bf28aa67ac7",
        "422d879e-a64d-4df5-bfee-d8d425a16613": "d77b3ada-0483-490c-ad17-a227379328c6",
        "6490f427-1853-40a4-9ffb-46e510a88405": "c31c45a7-966f-458c-8371-04991a82b9fd",
        "0aa17739-d23e-4951-8575-cfac4c3c50d5": "d32a47cb-4608-443e-aa5e-a48d26b7c00f",
        "7af8f0a5-9505-4128-b4ef-969177a03e34": "69c5e95f-4312-456b-a42d-d1eb6effedc1",
        "37d662ef-ed9a-4553-94f0-c2ed19bc54db": "b703e7d1-1ad6-41ef-99f8-cdd9340d9999",
        "3a0c7af4-9e2d-4674-bde8-b3b55bf3e4b5": "2c993032-e367-4dc8-b191-cab5375a93f5",
        "3d96adc7-e945-40bc-b3ed-848ee59ec92b": "4577196c-ff1f-47b3-9586-fa6f3ab49bfd",
        "577c9f2f-a13c-4f94-a33e-5c5547a6e1cd": "2b7b9cd2-07d5-49f9-ba98-8b8246b71a9f",
        "62e812d6-54f8-4720-bb57-3f0168863e0a": "7f557e32-d63c-4d50-a6fe-1c1e32a80578",
        "65b3b385-d32d-4e59-b88e-07c0e5caba0e": "7b4c7f3d-f99d-4586-bd79-5bc91a2b05de",
        "775a5e5c-b7d7-4fb0-b652-443acb6ec0bb": "2f8489e9-1cfc-43be-8636-b261a385d4a2",
        "9105e74c-bfca-4711-8a09-8b96ae723ab7": "dcac1edf-9056-435d-b578-ad80da2eb3b9",
        "a599627d-6e63-4c65-aea9-8260461f2b5b": "45cf0467-e747-49a1-b610-8447f15144fa",
        "bf16f047-cfdf-4a81-829c-67ef2220663b": "ba10d846-864e-4f9b-81d8-002e3e87b104",
        "d59a692b-6ba4-4e08-bed0-add6aa721491": "6b5c8ea4-22f6-4570-807e-7b3c2aba11a3",
        "ed2e2d20-1280-41ed-8b6c-48e7b2d29b99": "a4fb466b-5e40-4cb7-a19e-cce4fbdc980c",
        "fc9e9885-b779-4545-b741-af712173f541": "38630be0-b0d2-482f-b5cf-def0a55af524",
        "ff16f4fa-8128-4ce5-933d-fa356b123969": "259b449b-1154-42f5-af0a-bf1c69b34dbc"
    }'::JSONB;
    key TEXT;
    value JSONB;
BEGIN
    -- Loop through all submissions for this test
    FOR sub IN
        SELECT id, answers
        FROM test_submissions
        WHERE test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
    LOOP
        old_answers := sub.answers;
        new_answers := '{}'::JSONB;

        -- Remap each answer key
        FOR key, value IN SELECT * FROM jsonb_each(old_answers)
        LOOP
            IF mapping ? key THEN
                new_answers := new_answers || jsonb_build_object(mapping->>key, value);
            ELSE
                -- Keep unmapped keys as-is (shouldn't happen)
                new_answers := new_answers || jsonb_build_object(key, value);
            END IF;
        END LOOP;

        -- Update the submission
        UPDATE test_submissions
        SET answers = new_answers
        WHERE id = sub.id;

        RAISE NOTICE 'Updated submission %', sub.id;
    END LOOP;
END $$;

-- Verify the update worked
SELECT id, student_id, jsonb_object_keys(answers) as new_keys
FROM test_submissions
WHERE test_id = 'd87ca0fe-646b-467f-b0dc-84eee1aded65'
LIMIT 1;
