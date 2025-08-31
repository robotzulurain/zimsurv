from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from datetime import date
from .models import LabResult

class TestSmoke(TestCase):
    def setUp(self):
        self.u = User.objects.create_user('t','', 'p')
        self.client = APIClient()
        self.client.force_authenticate(self.u)
        LabResult.objects.create(
            patient_id='X1', sex='M', age=33,
            specimen_type='Blood', organism='E.coli',
            antibiotic='Ampicillin', ast_result='R',
            test_date=date(2025,7,1)
        )

    def test_counts_summary(self):
        r = self.client.get('/api/summary/counts-summary/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('total_results', r.json())

    def test_organism_counts_list(self):
        r = self.client.get('/api/summary/organism-counts/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(isinstance(r.json(), list))
