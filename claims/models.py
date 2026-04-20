from django.db import models
import uuid

class ClaimSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Deceased
    deceased_name = models.CharField(max_length=255)
    deceased_pan = models.CharField(max_length=15)
    death_certificate_no = models.CharField(max_length=100)
    death_certificate_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    
    # Claimant
    claimant_name = models.CharField(max_length=255)
    claimant_aadhaar_last4 = models.CharField(max_length=4)
    relation = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15)
    
    # Status tracking
    status = models.CharField(max_length=50, default='pending') # pending, verified, loan_accepted
    fraud_risk_score = models.IntegerField(default=2)
    total_assets_found = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    bridge_loan_available = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} - {self.claimant_name} claiming for {self.deceased_name}"

class DiscoveredAsset(models.Model):
    session = models.ForeignKey(ClaimSession, related_name='assets', on_delete=models.CASCADE)
    institution = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    situation_label = models.CharField(max_length=255)
    color = models.CharField(max_length=50) # green, amber, red
    message = models.TextField()
    documents_needed = models.JSONField(default=list)
    next_steps = models.JSONField(default=list)
    time_estimate = models.CharField(max_length=100)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return f"{self.institution} - {self.amount}"
