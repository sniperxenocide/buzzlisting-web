from __future__ import unicode_literals
from datetime import datetime
from django.core.mail import send_mail
from django.core.validators import RegexValidator
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import PermissionsMixin
from django.contrib.auth.base_user import AbstractBaseUser
from django.utils.translation import ugettext_lazy as _

from apps.dms.api.department.models import Department
from .manager import UserManager


class Permission(models.Model):
    name = models.CharField(max_length=50, blank=False,
                            null=False, unique=True)
    code = models.CharField(max_length=50, blank=False, unique=True)
    active = models.BooleanField()

    def __str__(self):
        return '{}'.format(self.name)


class Role(models.Model):
    name = models.CharField(max_length=50, blank=False,
                            null=False, unique=True)
    code = models.CharField(max_length=50, blank=False, unique=True)
    active = models.BooleanField()
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    permission = models.ManyToManyField(Permission, related_name='permissions')

    def __str__(self):
        return self.name


def default_expiry_date():
    return timezone.now() + timezone.timedelta(days=21914.5319)


def avatar_dir(instance, filename):
    return 'avatars/{}/{}'.format(instance.username, filename)


def signature_dir(instance, filename):
    return 'signatures/{}/{}'.format(instance.username, filename)


status_choices = (
    ('0', 'Inactive'),
    ('1', 'Active'),
    ('2', 'Vacation'),
    ('3', 'Expired'),
)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        _('email address'), unique=True, null=False, blank=False)
    username = models.CharField(_('user name'), max_length=50,
                                unique=True,
                                null=False,
                                blank=False,
                                validators=[RegexValidator(
                                    regex='[-a-zA-Z0-9_.]{4,50}$',
                                    message='Username contains alphanumeric, underscore and period(.). Length: 4 to 50'
                                )])
    first_name = models.CharField(_('first name'), max_length=30, blank=True, null=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=False, null=True)
    date_joined = models.DateTimeField(_('date joined'), auto_now_add=True)
    is_active = models.BooleanField(_('active'), default=True)
    avatar = models.ImageField(upload_to=avatar_dir, null=True, blank=True)
    signature = models.ImageField(upload_to=signature_dir, null=True, blank=True)
    address = models.CharField(max_length=120, blank=True, null=True)
    phone_number = models.CharField(blank=False, max_length=14, null=True)
    position = models.CharField(max_length=50, blank=True, null=True)
    expiry_date = models.DateTimeField(
        default=default_expiry_date, null=False, blank=False)
    status = models.CharField(choices=status_choices, max_length=50, default=1)
    role = models.ForeignKey(
        Role, on_delete=models.PROTECT, null=False, blank=False, related_name='user', default=2)

    configuration_type = models.IntegerField(choices=(
        (0, 'cannot configure'), (1, 'can configure and DMS'), (2, 'can configure and workflow'),),
        default=0
    )
    department = models.ForeignKey(Department, blank=True, null=True)
    reports_to = models.ForeignKey('self', null=True, blank=True)
    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    def __str__(self):
        return '%s %s (%s)' % (self.first_name, self.last_name, self.username)

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def save(self, *args, **kwargs):
        self.clean()
        super(User, self).save()

    def clean(self):
        if self.username:
            return " ".join(self.username.lower().split())

    def get_full_name(self):
        '''
        Returns the first_name plus the last_name, with a space in between.
        '''
        full_name = '{0} {1}'.format(self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        '''
        Returns the short name for the user.
        '''
        return self.first_name

    def email_user(self, subject, message, from_email=None, **kwargs):
        '''
        Sends an email to this User.
        '''
        send_mail(subject, message, from_email, [self.email], **kwargs)


class UserDelegate(models.Model):
    is_active = models.IntegerField(null=False, blank=False, choices=((0, 'No'), (1, 'Yes'), (-1, 'Upcoming')))
    absent_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='absent_user')
    present_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='present_user')
    start_date = models.DateField(_('start_date'), null=False, blank=False)
    end_date = models.DateField(_('end_date'), null=False, blank=False)

    def __str__(self):
        return '{} {} {} {} {}'.format(self.is_active,self.absent_user,self.present_user,self.start_date,self.end_date)

    @property
    def is_expired(self):
        if datetime.now().date() > self.end_date:
            return True
        return False

    @property
    def is_delegation_started(self):
        if datetime.now().date() < self.start_date:
            return False
        return True


class Group(models.Model):
    name = models.CharField(max_length=100,
                            blank=False,
                            null=False,
                            unique=True,
                            validators=[RegexValidator(
                                regex='[-a-zA-Z0-9_.\s]{2,100}$',
                                message='Group contains alphanumeric, underscore, space and period(.). Length: 2 to 100'
                            )]
                            )
    status = models.BooleanField(default=True)
    user = models.ManyToManyField(User, blank=True, related_name='group')

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.clean()
        super(Group, self).save()

    def clean(self):
        if self.name:
            return " ".join(self.name.split())


class Freehold(models.Model):
    AccessToProperty1 = models.CharField(max_length=70,blank=True, null=True)
    AccessToProperty2 = models.CharField(max_length=70,blank=True, null=True)
    Acreage = models.CharField(max_length=70,blank=True, null=True)
    AddlMonthlyFees = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Address = models.CharField(max_length=70,blank=True, null=True)
    AirConditioning = models.CharField(max_length=70,blank=True, null=True)
    AllInclusive = models.CharField(max_length=70,blank=True, null=True)
    ApproxAge = models.CharField(max_length=70,blank=True, null=True)
    ApproxSquareFootage = models.CharField(max_length=70,blank=True, null=True)
    AptUnit = models.CharField(max_length=70,blank=True, null=True)
    Area = models.CharField(max_length=70,blank=True, null=True)
    AreaCode = models.CharField(max_length=70,blank=True, null=True)
    Assessment = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    AssessmentYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Basement1 = models.CharField(max_length=70,blank=True, null=True)
    Basement2 = models.CharField(max_length=70,blank=True, null=True)
    Bedrooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BedroomsPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    CableTVIncluded = models.CharField(max_length=70,blank=True, null=True)
    CACIncluded = models.CharField(max_length=70,blank=True, null=True)
    CentralVac = models.CharField(max_length=70,blank=True, null=True)
    CommonElementsIncluded = models.CharField(max_length=70,blank=True, null=True)
    Community = models.CharField(max_length=70,blank=True, null=True)
    CommunityCode = models.CharField(max_length=70,blank=True, null=True)
    DirectionsCrossStreets = models.CharField(max_length=70,blank=True, null=True)
    DisplayAddressOnInternet = models.CharField(max_length=70,blank=True, null=True)
    Drive = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions1 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions2 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions3 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions4 = models.CharField(max_length=70,blank=True, null=True)
    Elevator = models.CharField(max_length=70,blank=True, null=True)
    Exterior1 = models.CharField(max_length=70,blank=True, null=True)
    Exterior2 = models.CharField(max_length=70,blank=True, null=True)
    Extras = models.CharField(max_length=270,blank=True, null=True)
    FamilyRoom = models.CharField(max_length=70,blank=True, null=True)
    FarmAgriculture = models.CharField(max_length=70,blank=True, null=True)
    FireplaceStove = models.CharField(max_length=70,blank=True, null=True)
    FrontingOn = models.CharField(max_length=70,blank=True, null=True)
    Furnished = models.CharField(max_length=70,blank=True, null=True)
    GarageSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GarageType = models.CharField(max_length=70,blank=True, null=True)
    HeatIncluded = models.CharField(max_length=70,blank=True, null=True)
    HeatSource = models.CharField(max_length=70,blank=True, null=True)
    HeatType = models.CharField(max_length=70, blank=True, null=True)
    HydroIncluded = models.CharField(max_length=70, blank=True, null=True)
    IDXUpdatedDate = models.DateTimeField(auto_now_add=False, blank=True, null=True)
    Kitchens = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    KitchensPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LaundryAccess = models.CharField(max_length=70, blank=True, null=True)
    LaundryLevel = models.CharField(max_length=70, blank=True, null=True)
    LeaseTerm = models.CharField(max_length=70, blank=True, null=True)
    LegalDescription = models.CharField(max_length=70, blank=True, null=True)
    Level1 = models.CharField(max_length=70, blank=True, null=True)
    Level10 = models.CharField(max_length=70, blank=True, null=True)
    Level11 = models.CharField(max_length=70, blank=True, null=True)
    Level12 = models.CharField(max_length=70, blank=True, null=True)
    Level2 = models.CharField(max_length=70, blank=True, null=True)
    Level3 = models.CharField(max_length=70, blank=True, null=True)
    Level4 = models.CharField(max_length=70, blank=True, null=True)
    Level5 = models.CharField(max_length=70, blank=True, null=True)
    Level6 = models.CharField(max_length=70, blank=True, null=True)
    Level7 = models.CharField(max_length=70, blank=True, null=True)
    Level8 = models.CharField(max_length=70, blank=True, null=True)
    Level9 = models.CharField(max_length=70, blank=True, null=True)
    ListBrokerage = models.CharField(max_length=70, blank=True, null=True)
    ListPrice = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    LotDepth = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LotFront = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LotIrregularities = models.CharField(max_length=70, blank=True, null=True)
    LotSizeCode = models.CharField(max_length=70, blank=True, null=True)
    MapNumber = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapColumn = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapRow = models.CharField(max_length=70, blank=True, null=True)
    MLSNumber = models.CharField(max_length=70, blank=True, null=True)
    Municipality = models.CharField(max_length=70, blank=True, null=True)
    MunicipalityDistrict = models.CharField(max_length=70, blank=True, null=True)
    MunicpCode = models.CharField(max_length=70, blank=True, null=True)
    OtherStructures1 = models.CharField(max_length=70, blank=True, null=True)
    OtherStructures2 = models.CharField(max_length=70, blank=True, null=True)
    OutofAreaMunicipality = models.CharField(max_length=70, blank=True, null=True)
    ParcelofTiedLand = models.CharField(max_length=70, blank=True, null=True)
    ParkCostMo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ParkingIncluded = models.CharField(max_length=70, blank=True, null=True)
    ParkingSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    PINNumber = models.CharField(max_length=70, blank=True, null=True)
    PixUpdatedDate = models.DateTimeField(auto_now_add=False, blank=True, null=True)
    Pool = models.CharField(max_length=70, blank=True, null=True)
    PostalCode = models.CharField(max_length=70, blank=True, null=True)
    PrivateEntrance = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures3 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures4 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures5 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures6 = models.CharField(max_length=70, blank=True, null=True)
    Province = models.CharField(max_length=70, blank=True, null=True)
    RemarksForClients = models.CharField(max_length=570, blank=True, null=True)
    Retirement = models.CharField(max_length=70, blank=True, null=True)
    Room1 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room1Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room1Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room10 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room10Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room10Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room11 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room11Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room11Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room12 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room12Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room12Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room2 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room2Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room2Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room3 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room3Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room3Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room4 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room4Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room4Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room5 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room5Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room5Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room6 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room6Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room6Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room7 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room7Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room7Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room8 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room8Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room8Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room9 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room9Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room9Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Rooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    RoomsPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    RuralServices1 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices2 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices3 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices4 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices5 = models.CharField(max_length=70, blank=True, null=True)
    SaleLease = models.CharField(max_length=70, blank=True, null=True)
    SAlternativePower1 = models.CharField(max_length=70,blank=True, null=True)
    SAlternativePower2 = models.CharField(max_length=70,blank=True, null=True)
    SellerPropertyInfoStatement = models.CharField(max_length=70, blank=True, null=True)
    Sewage1 = models.CharField(max_length=70, blank=True, null=True)
    Sewage2 = models.CharField(max_length=70, blank=True, null=True)
    Sewers = models.CharField(max_length=70, blank=True, null=True)
    ShorelineAllowance = models.CharField(max_length=70, blank=True, null=True)
    ShorelineExposure = models.CharField(max_length=70, blank=True, null=True)
    Shoreline1 = models.CharField(max_length=70, blank=True, null=True)
    Shoreline2 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation1 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation2 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation3 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation4 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation5 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation6 = models.CharField(max_length=70, blank=True, null=True)
    Status = models.CharField(max_length=70, blank=True, null=True)
    StreetNumber = models.CharField(max_length=70, blank=True, null=True)
    StreetAbbreviation = models.CharField(max_length=70, blank=True, null=True)
    StreetDirection = models.CharField(max_length=70, blank=True, null=True)
    StreetName = models.CharField(max_length=70, blank=True, null=True)
    Style = models.CharField(max_length=70, blank=True, null=True)
    TaxYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Taxes = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TotalParkingSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Type1 = models.CharField(max_length=70, blank=True, null=True)
    Type2 = models.CharField(max_length=70, blank=True, null=True)
    UFFI = models.CharField(max_length=70, blank=True, null=True)
    UpdatedTimestamp = models.DateTimeField(auto_now_add=False, blank=True, null=True)
    UtilitiesCable = models.CharField(max_length=70, blank=True, null=True)
    UtilitiesGas = models.CharField(max_length=70, blank=True, null=True)
    UtilitiesHydro = models.CharField(max_length=70, blank=True, null=True)
    UtilitiesTelephone = models.CharField(max_length=70, blank=True, null=True)
    VirtualTourUploadDate = models.DateTimeField(auto_now_add=False, blank=True, null=True)
    VirtualtourURL = models.CharField(max_length=500, blank=True, null=True)
    Washrooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType2 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType2Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType2Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType3 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType3Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType3Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType4 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType4Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType4Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType5 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType5Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType5Level = models.CharField(max_length=70, blank=True, null=True)
    Water = models.CharField(max_length=70, blank=True, null=True)
    WaterBodyName = models.CharField(max_length=70, blank=True, null=True)
    WaterDeliveryFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    WaterDeliveryFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures3 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures4 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures5 = models.CharField(max_length=70, blank=True, null=True)
    WaterFrontage = models.DateTimeField(auto_now_add=False, blank=True, null=True)
    WaterIncluded = models.CharField(max_length=70, blank=True, null=True)
    WaterSupplyTypes = models.CharField(max_length=70, blank=True, null=True)
    WaterType = models.CharField(max_length=70, blank=True, null=True)
    Waterfront = models.CharField(max_length=70, blank=True, null=True)
    WaterfrontAccessoryBldgs1 = models.CharField(max_length=70, blank=True, null=True)
    WaterfrontAccessoryBldgs2 = models.CharField(max_length=70, blank=True, null=True)
    Zoning = models.CharField(max_length=70, blank=True, null=True)

    def __str__(self):
        return self.Address


class Condo(models.Model):
    Shares = models.CharField(max_length=70,blank=True, null=True)
    AccessToProperty1 = models.CharField(max_length=70,blank=True, null=True)
    AccessToProperty2 = models.CharField(max_length=70,blank=True, null=True)
    Address = models.CharField(max_length=70,blank=True, null=True)
    AirConditioning = models.CharField(max_length=70,blank=True, null=True)
    AllInclusive = models.CharField(max_length=70,blank=True, null=True)
    ApproxAge = models.CharField(max_length=70,blank=True, null=True)
    ApproxSquareFootage = models.CharField(max_length=70,blank=True, null=True)
    AptUnit = models.CharField(max_length=70,blank=True, null=True)
    Area = models.CharField(max_length=70,blank=True, null=True)
    AreaCode = models.CharField(max_length=70,blank=True, null=True)
    Assessment = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    AssessmentYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    # Balcony = models.CharField(max_length=70,blank=True, null=True)
    Basement1 = models.CharField(max_length=70,blank=True, null=True)
    Basement2 = models.CharField(max_length=70,blank=True, null=True)
    Bedrooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BedroomsPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BuildingInsuranceIncluded = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities1 = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities2 = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities3 = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities4 = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities5 = models.CharField(max_length=70,blank=True, null=True)
    BuildingAmenities6 = models.CharField(max_length=70,blank=True, null=True)
    CableTVIncluded = models.CharField(max_length=70,blank=True, null=True)
    CACIncluded = models.CharField(max_length=70,blank=True, null=True)
    CentralVac = models.CharField(max_length=70,blank=True, null=True)
    CommonElementsIncluded = models.CharField(max_length=70,blank=True, null=True)
    Community = models.CharField(max_length=70,blank=True, null=True)
    CommunityCode = models.CharField(max_length=70,blank=True, null=True)
    CondoCorp = models.IntegerField(null=True)
    CondoRegistryOffice  = models.CharField(max_length=70,blank=True, null=True)
    CondoTaxesIncluded  = models.CharField(max_length=70,blank=True, null=True)
    DirectionsCrossStreets = models.CharField(max_length=70,blank=True, null=True)
    DisplayAddressOnInternet = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions1 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions2 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions3 = models.CharField(max_length=70,blank=True, null=True)
    EasementsRestrictions4 = models.CharField(max_length=70,blank=True, null=True)
    Elevator = models.CharField(max_length=70,blank=True, null=True)
    EnsuiteLaundry = models.CharField(max_length=70,blank=True, null=True)
    Exposure = models.CharField(max_length=70,blank=True, null=True)
    Exterior1 = models.CharField(max_length=70,blank=True, null=True)
    Exterior2 = models.CharField(max_length=70,blank=True, null=True)
    Extras = models.CharField(max_length=270,blank=True, null=True)
    FamilyRoom = models.CharField(max_length=70,blank=True, null=True)
    FireplaceStove = models.CharField(max_length=70,blank=True, null=True)
    Furnished = models.CharField(max_length=70,blank=True, null=True)
    GarageType = models.CharField(max_length=70,blank=True, null=True)
    GarageParkSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    HeatIncluded = models.CharField(max_length=70,blank=True, null=True)
    HeatSource = models.CharField(max_length=70,blank=True, null=True)
    HeatType = models.CharField(max_length=70, blank=True, null=True)
    HydroIncluded = models.CharField(max_length=70, blank=True, null=True)
    IDXUpdatedDate = models.DateTimeField(auto_now_add=False, null=True)
    Kitchens = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    KitchensPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LaundryAccess = models.CharField(max_length=70, blank=True, null=True)
    LaundryLevel = models.CharField(max_length=70, blank=True, null=True)
    LeaseTerm = models.CharField(max_length=70, blank=True, null=True)
    Level = models.CharField(max_length=70,blank=True, null=True)
    Level1 = models.CharField(max_length=70, blank=True, null=True)
    Level10 = models.CharField(max_length=70, blank=True, null=True)
    Level11 = models.CharField(max_length=70, blank=True, null=True)
    Level12 = models.CharField(max_length=70, blank=True, null=True)
    Level2 = models.CharField(max_length=70, blank=True, null=True)
    Level3 = models.CharField(max_length=70, blank=True, null=True)
    Level4 = models.CharField(max_length=70, blank=True, null=True)
    Level5 = models.CharField(max_length=70, blank=True, null=True)
    Level6 = models.CharField(max_length=70, blank=True, null=True)
    Level7 = models.CharField(max_length=70, blank=True, null=True)
    Level8 = models.CharField(max_length=70, blank=True, null=True)
    Level9 = models.CharField(max_length=70, blank=True, null=True)
    ListBrokerage = models.CharField(max_length=70, blank=True, null=True)
    ListPrice = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    Locker = models.CharField(max_length=70,blank=True, null=True)
    LockerNumber = models.CharField(max_length=70, blank=True, null=True)
    LockerLevel = models.CharField(max_length=70, blank=True, null=True)
    LockerUnit = models.CharField(max_length=70, blank=True, null=True)
    Maintenance = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapNumber = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapColumn = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapRow = models.CharField(max_length=70, blank=True, null=True)
    MLSNumber = models.CharField(max_length=70, blank=True, null=True)
    Municipality = models.CharField(max_length=70, blank=True, null=True)
    MunicipalityDistrict = models.CharField(max_length=70, blank=True, null=True)
    MunicpCode = models.CharField(max_length=70, blank=True, null=True)
    OutofAreaMunicipality = models.CharField(max_length=70, blank=True, null=True)
    ParkCostMo = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ParkingIncluded = models.CharField(max_length=70, blank=True, null=True)
    ParkingLegalDescription = models.CharField(max_length=70, blank=True, null=True)
    ParkingLegalDescription2 = models.CharField(max_length=70, blank=True, null=True)
    ParkingSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ParkingSpot1 = models.CharField(max_length=70, blank=True, null=True)
    ParkingSpot2 = models.CharField(max_length=70, blank=True, null=True)
    ParkingType = models.CharField(max_length=70, blank=True, null=True)
    ParkingType2 = models.CharField(max_length=70, blank=True, null=True)
    ParkingDrive = models.CharField(max_length=70, blank=True, null=True)
    PetsPermitted = models.CharField(max_length=70, blank=True, null=True)
    PINNumber = models.CharField(max_length=70, blank=True, null=True)
    PixUpdatedDate = models.DateTimeField(auto_now_add=False, null=True)
    PostalCode = models.CharField(max_length=70, blank=True, null=True)
    PrivateEntrance = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures3 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures4 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures5 = models.CharField(max_length=70, blank=True, null=True)
    PropertyFeatures6 = models.CharField(max_length=70, blank=True, null=True)
    Province = models.CharField(max_length=70, blank=True, null=True)
    RemarksForClients = models.CharField(max_length=570, blank=True, null=True)
    Retirement = models.CharField(max_length=70, blank=True, null=True)
    Room1 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room1Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room1Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room1Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room10 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room10Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room10Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room10Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room11 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room11Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room11Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room11Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room12 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room12Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room12Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room12Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room2 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room2Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room2Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room2Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room3 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room3Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room3Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room3Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room4 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room4Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room4Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room4Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room5 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room5Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room5Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room5Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room6 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room6Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room6Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room6Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room7 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room7Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room7Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room7Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room8 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room8Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room8Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room8Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room9 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc1 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc2 = models.CharField(max_length=70, blank=True, null=True)
    Room9Desc3 = models.CharField(max_length=70, blank=True, null=True)
    Room9Length = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Room9Width = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Rooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    RoomsPlus = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    RuralServices1 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices2 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices3 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices4 = models.CharField(max_length=70, blank=True, null=True)
    RuralServices5 = models.CharField(max_length=70, blank=True, null=True)
    SaleLease = models.CharField(max_length=70, blank=True, null=True)
    SAlternativePower1 = models.CharField(max_length=70,blank=True, null=True)
    SAlternativePower2 = models.CharField(max_length=70,blank=True, null=True)
    Sewage1 = models.CharField(max_length=70, blank=True, null=True)
    Sewage2 = models.CharField(max_length=70, blank=True, null=True)
    ShorelineAllowance = models.CharField(max_length=70, blank=True, null=True)
    ShorelineExposure = models.CharField(max_length=70, blank=True, null=True)
    Shoreline1 = models.CharField(max_length=70, blank=True, null=True)
    Shoreline2 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation1 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation2 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation3 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation4 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation5 = models.CharField(max_length=70, blank=True, null=True)
    SpecialDesignation6 = models.CharField(max_length=70, blank=True, null=True)
    Status = models.CharField(max_length=70, blank=True, null=True)
    StreetNumber = models.CharField(max_length=70, blank=True, null=True)
    StreetAbbreviation = models.CharField(max_length=70, blank=True, null=True)
    StreetDirection = models.CharField(max_length=70, blank=True, null=True)
    StreetName = models.CharField(max_length=70, blank=True, null=True)
    Style = models.CharField(max_length=70, blank=True, null=True)
    TaxYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Taxes = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TotalParkingSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Type1 = models.CharField(max_length=70, blank=True, null=True)
    Type2 = models.CharField(max_length=70, blank=True, null=True)
    UFFI = models.CharField(max_length=70, blank=True, null=True)
    UnitNumber = models.CharField(max_length=70, blank=True, null=True)
    UpdatedTimestamp = models.DateTimeField(auto_now_add=False, null=True)
    VirtualTourUploadDate = models.DateTimeField(auto_now_add=False, null=True)
    VirtualtourURL = models.CharField(max_length=500, blank=True, null=True)
    Washrooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType1Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType2 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType2Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType2Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType3 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType3Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType3Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType4 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType4Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType4Level = models.CharField(max_length=70, blank=True, null=True)
    WashroomsType5 = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType5Pcs = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WashroomsType5Level = models.CharField(max_length=70, blank=True, null=True)
    WaterBodyName = models.CharField(max_length=70, blank=True, null=True)
    WaterBodyType = models.CharField(max_length=70, blank=True, null=True)
    WaterDeliveryFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    WaterDeliveryFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    WaterFeatures1 = models.CharField(max_length=70, blank=True, null=True)
    # WaterFeatures2 = models.CharField(max_length=70, blank=True, null=True)
    # WaterFeatures3 = models.CharField(max_length=70, blank=True, null=True)
    # WaterFeatures4 = models.CharField(max_length=70, blank=True, null=True)
    # WaterFeatures5 = models.CharField(max_length=70, blank=True, null=True)
    WaterFrontage = models.DateTimeField(auto_now_add=False, null=True)
    WaterIncluded = models.CharField(max_length=70, blank=True, null=True)
    WaterfrontAccessoryBldgs1 = models.CharField(max_length=70, blank=True, null=True)
    WaterfrontAccessoryBldgs2 = models.CharField(max_length=70, blank=True, null=True)
    Zoning = models.CharField(max_length=70, blank=True, null=True)

    def __str__(self):
        return self.Address


class Commercial(models.Model):
    TrailerParkingSpots = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BuildingPercent = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Address = models.CharField(max_length=70, blank=True, null=True)
    AirConditioning = models.CharField(max_length=70, blank=True, null=True)
    Amps = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ApproxAge = models.CharField(max_length=70, blank=True, null=True)
    AptUnit = models.CharField(max_length=70, blank=True, null=True)
    Area = models.CharField(max_length=70, blank=True, null=True)
    AreaCode = models.CharField(max_length=70, blank=True, null=True)
    AreaInfluences1 = models.CharField(max_length=70, blank=True, null=True)
    AreaInfluences2 = models.CharField(max_length=70, blank=True, null=True)
    Assessment = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    AssessmentYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Basement1 = models.CharField(max_length=70, blank=True, null=True)
    BaySizeLengthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BaySizeLengthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BaySizeWidthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BaySizeWidthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    BusinessBuildingName = models.CharField(max_length=70, blank=True, null=True)
    Category = models.CharField(max_length=70, blank=True, null=True)
    Chattels = models.CharField(max_length=70, blank=True, null=True)
    ClearHeightFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ClearHeightInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    CommercialCondoFees = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    CommonAreaUpcharge = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Community = models.CharField(max_length=70, blank=True, null=True)
    CommunityCode = models.CharField(max_length=70, blank=True, null=True)
    Crane = models.CharField(max_length=70, blank=True, null=True)
    DaysOpen = models.CharField(max_length=70, blank=True, null=True)
    DirectionsCrossStreets = models.CharField(max_length=70, blank=True, null=True)
    DisplayAddressOnInternet = models.CharField(max_length=70, blank=True, null=True)
    DoubleManShippingDoors = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DoubleManShippingDoorsHeightFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DoubleManShippingDoorsHeightInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DoubleManShippingDoorsWidthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DoubleManShippingDoorsWidthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DriveInLevelShippingDoors = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DriveInLevelShippingDoorsHeightFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DriveInLevelShippingDoorsHeightInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DriveInLevelShippingDoorsWidthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    DriveInLevelShippingDoorsWidthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Elevator = models.CharField(max_length=70, blank=True, null=True)
    Employees = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    EstimInventoryValuesAtCost = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    ExpensesActualEstimated = models.CharField(max_length=70, blank=True, null=True)
    Extras = models.CharField(max_length=270, blank=True, null=True)
    FinancialStatement = models.CharField(max_length=70, blank=True, null=True)
    Franchise = models.CharField(max_length=70, blank=True, null=True)
    Freestanding = models.CharField(max_length=70, blank=True, null=True)
    GarageType = models.CharField(max_length=70, blank=True, null=True)
    GradeLevelShippingDoors = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GradeLevelShippingDoorsHeightFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GradeLevelShippingDoorsHeightInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GradeLevelShippingDoorsWidthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GradeLevelShippingDoorsWidthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    GrossIncomeSales = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    HeatExpenses = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    HeatType = models.CharField(max_length=70, blank=True, null=True)
    HoursOpen = models.CharField(max_length=70, blank=True, null=True)
    HydroExpense = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    IDXUpdatedDate = models.DateTimeField(auto_now_add=False, null=True)
    IndustrialArea = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    IndustrialAreaCode = models.CharField(max_length=70, blank=True, null=True)
    InsuranceExpense = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LegalDescription = models.CharField(max_length=70, blank=True, null=True)
    ListBrokerage = models.CharField(max_length=70, blank=True, null=True)
    ListPrice = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    ListPriceCode = models.CharField(max_length=70, blank=True, null=True)
    LLBO = models.CharField(max_length=70, blank=True, null=True)
    LotDepth = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LotFront = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    LotIrregularities = models.CharField(max_length=70, blank=True, null=True)
    LotSizeCode = models.CharField(max_length=70, blank=True, null=True)
    LotBldgUnitCode = models.CharField(max_length=70, blank=True, null=True)
    Maintenance = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    ManagementExpense = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Map = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapColumn = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MapRow = models.CharField(max_length=70, blank=True, null=True)
    MaximumRentalTerm = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MinimumRentalTerm = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    MLSNumber = models.CharField(max_length=70, blank=True, null=True)
    Municipality = models.CharField(max_length=70, blank=True, null=True)
    MunicipalityDistrict = models.CharField(max_length=70, blank=True, null=True)
    MunicpCode = models.CharField(max_length=70, blank=True, null=True)
    NetIncomeBeforeDebt = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Occupancy = models.CharField(max_length=70, blank=True, null=True)
    OfficeAptArea = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    OfficeAptAreaCode = models.CharField(max_length=70, blank=True, null=True)
    OperatingExpenses = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    OtherExpenses = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    OutofAreaMunicipality = models.CharField(max_length=70, blank=True, null=True)
    OutsideStorage = models.CharField(max_length=70, blank=True, null=True)
    ParkingSpaces = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    PercentageRent = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    PINNumber = models.CharField(max_length=70, blank=True, null=True)
    PixUpdatedDate = models.DateTimeField(auto_now_add=False, null=True)
    PostalCode = models.CharField(max_length=70, blank=True, null=True)
    Province = models.CharField(max_length=70, blank=True, null=True)
    Rail = models.CharField(max_length=70, blank=True, null=True)
    RemarksForClients = models.CharField(max_length=570, blank=True, null=True)
    RetailArea = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    RetailAreaCode = models.CharField(max_length=70, blank=True, null=True)
    SaleLease = models.CharField(max_length=70, blank=True, null=True)
    Seats = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    SellerPropertyInfoStatement = models.CharField(max_length=70, blank=True, null=True)
    Sewers = models.CharField(max_length=70, blank=True, null=True)
    SoilTest = models.CharField(max_length=70, blank=True, null=True)
    Sprinklers = models.CharField(max_length=70, blank=True, null=True)
    Status = models.CharField(max_length=70, blank=True, null=True)
    StreetNumber = models.CharField(max_length=70, blank=True, null=True)
    StreetAbbreviation = models.CharField(max_length=70, blank=True, null=True)
    StreetDirection = models.CharField(max_length=70, blank=True, null=True)
    StreetName = models.CharField(max_length=70, blank=True, null=True)
    Survey = models.CharField(max_length=70, blank=True, null=True)
    TaxYear = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Taxes = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TaxesExpense = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TotalArea = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    TotalAreaCode = models.CharField(max_length=70, blank=True, null=True)
    TruckLevelShippingDoors = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TruckLevelShippingDoorsHeightFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TruckLevelShippingDoorsHeightInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TruckLevelShippingDoorsWidthFeet = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    TruckLevelShippingDoorsWidthInches = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Type1 = models.CharField(max_length=70, blank=True, null=True)
    Type2 = models.CharField(max_length=70, blank=True, null=True)
    TypeTaxes = models.CharField(max_length=70, blank=True, null=True)
    UFFI = models.CharField(max_length=70, blank=True, null=True)
    UpdatedTimestamp = models.DateTimeField(auto_now_add=False, null=True)
    Use = models.CharField(max_length=70, blank=True, null=True)
    Utilities = models.CharField(max_length=70, blank=True, null=True)
    VacancyAllowance = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    VirtualTourUploadDate = models.DateTimeField(auto_now_add=False, null=True)
    VirtualTourURL = models.CharField(max_length=500, blank=True, null=True)
    Volts = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Washrooms = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Water  = models.CharField(max_length=70, blank=True, null=True)
    WaterExpense = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    WaterSupplyTypes = models.CharField(max_length=70, blank=True, null=True)
    YearExpenses = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    Zoning = models.CharField(max_length=70, blank=True, null=True)

    def __str__(self):
        return self.Address


class HouseLocation(models.Model):
    freehold = models.ForeignKey(Freehold, on_delete=models.CASCADE, null=True)
    commercial = models.ForeignKey(Commercial, on_delete=models.CASCADE, null=True)
    condo = models.ForeignKey(Condo, on_delete=models.CASCADE, null=True)
    latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    type = models.IntegerField(choices=[(1, 'Residential'), (2, 'Condo'),(3, 'Commercial')], null=False, blank=False)

class AppUser(models.Model):
    username = models.CharField(_('user name'), max_length=50,
                                unique=False,
                                null=False,
                                blank=False,
                                validators=[RegexValidator(
                                    regex='[-a-zA-Z0-9_.]{4,50}$',
                                    message='Username contains alphanumeric, underscore and period(.). Length: 4 to 50'
                                )])
    emailPhone = models.CharField(max_length=70, null=False, blank=False, unique=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    unregistered_at = models.DateTimeField(auto_now=False, null=True)
    registration = models.IntegerField(choices=[(1, 'Registered'), (2, 'Unregistered')], null=False, blank=False)
    password_reset_request = models.IntegerField(choices=[(1, 'Yes'), (2, 'No')], null=False, blank=False, default=2)
    source = models.IntegerField(choices=[(1, 'Facebook'), (2, 'Email')], null=False, blank=False)
    password = models.CharField(_('password'), max_length=128, null=True)
    def __str__(self):
        return self.emailPhone



class AppViewReport(models.Model):
    appuser = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='Applogin_data', null=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField()
    latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)

    def __str__(self):
        return '{} - {}'.format(str(self.ip), self.viewed_at)


class PropertyViewReport(models.Model):
    house = models.ForeignKey(HouseLocation, on_delete=models.CASCADE, null=False)
    appuser = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='AppUserlogin_data', null=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField()
    latitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=8, null=True)

    def __str__(self):
        return '{} - {}'.format(str(self.ip), self.viewed_at, self.latitude, self.longitude)


class Favourites(models.Model):
    house = models.ForeignKey(HouseLocation, on_delete=models.CASCADE, null=False)
    appuser = models.ForeignKey(AppUser, on_delete=models.CASCADE, null=True)
    def __str__(self):
        return self.appuser.username


class ContactRequest(models.Model):
    house = models.ForeignKey(HouseLocation, on_delete=models.CASCADE, null=False)
    appuser = models.ForeignKey(AppUser, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=170, null=True, blank=True)
    email = models.CharField(max_length=170, null=True, blank=True)
    phone = models.CharField(max_length=170, null=True, blank=True)
    msg = models.CharField(max_length=370, null=True, blank=True)
    source = models.CharField(max_length=170, null=False, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    comment = models.CharField(max_length=470, null=True, blank=True)
    status = models.IntegerField(choices=[(1, 'Resolved'), (2, 'Unresolved')], null=False, blank=False)


class MenuItems(models.Model):
    name = models.CharField(max_length=70, null=False, blank=False)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class LicenseText(models.Model):
    text = models.TextField()


class EmailText(models.Model):
    text = models.TextField()