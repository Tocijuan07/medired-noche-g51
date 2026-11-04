module.exports = {
    "info": {
        "_postman_id": "e1f3c8a0-4b9d-4f5e-9c6b-2f7e5c6e8f1a",
        "name": "ms-medicos",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
        "key": "base",
        "value": "http://localhost:3003"
        }
    ],
    "item": [
        {
        "name": "Médicos API",
        "item": [
            {
            "name": "Get all doctors",
            "request": {
                "method": "GET",
                "header": [],
                "url": {
                "raw": "{{base}}/medicos",
                "host": [
                    "{{base}}"
                ],
                "path": [
                    "medicos"
                ]
                }
            },
            "response": []
            }
        ]
        }
    ]
};