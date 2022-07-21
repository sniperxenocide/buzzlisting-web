import os
import re
import csv
import requests
import urllib
from django.shortcuts import render
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from apps.core.rbac.models import Commercial, Freehold, Condo, HouseLocation
from conf import settings
import logging
from decimal import Decimal


class Command(BaseCommand):
    # Show this when the user types help
    help = "My test command"


    # A command must define handle()
    def handle(self, *args, **options):

        total_residential_deleted = 0
        total_residential_updated = 0
        total_residential_update_failed = 0

        total_condo_deleted = 0
        total_condo_updated = 0
        total_condo_update_failed = 0

        total_commercial_deleted = 0
        total_commercial_updated = 0
        total_commercial_update_failed = 0


        '''#fahim  start processing RESIDENTIAL  ***********'''
        residentialproperties = Freehold.objects.all()
        AvailableResidentialProperties = []
        url = 'http://52.60.129.77/residential_All_available.csv'
        url2 = 'http://52.60.129.77/residential_inc.txt'
        response = requests.get(url)
        print("Residential Response: ", response)
        with requests.Session() as s:
            download = s.get(url)

            decoded_content = download.content.decode('utf-8')

            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                else:
                    mlsnumber = row[0]
                    mlsnumber = mlsnumber.strip()
                    AvailableResidentialProperties.append(mlsnumber)
        print(len(AvailableResidentialProperties))
        print(len(residentialproperties))
        mismatchCount = 0
        for aProperty in residentialproperties:
            mlsnumber = aProperty.MLSNumber
            mlsnumber = mlsnumber.strip()
            if mlsnumber not in AvailableResidentialProperties:
                mismatchCount += 1

                #fahim
                id_ = aProperty.id
                Freehold.objects.filter(id=aProperty.id).delete()
                total_residential_deleted += 1
                print(total_residential_deleted, ' Deleted Residential Property with id: ', id_)
                #Freehold.save()
                #fahim

        print(mismatchCount)
        incrementalResidentialProperties = []
        incrementalResidentialPropertiesRowArr = []
        response2 = requests.get(url2)
        print("Residential Response2: ", response2)
        residential_field_list = []
        with open('./templates/residential_fields.csv', mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                residential_field_list.append(row[0])
        print(residential_field_list)
        mlsindex = 0
        my_list = []
        residential_index_list = []
        with requests.Session() as s:
            download = s.get(url2)

            decoded_content = download.content.decode('utf-8')

            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                    print(row)
                    mlsindex = row.index('MLS#')
                    for i in range(0, len(row)):
                        if row[i] in residential_field_list:
                            residential_index_list.append(i)
                        else:
                            print(row[i], ' Not found')
                else:
                    mlsnumber = row[mlsindex]
                    line_count += 1
                    mlsnumber = mlsnumber.strip()
                    incrementalResidentialProperties.append(mlsnumber)
                    incrementalResidentialPropertiesRowArr.append(line_count-1)
        print(residential_index_list)
        print(len(residential_index_list))
        updateNum = 0
        lineIndex = 1  #fahim
        for aProperty in incrementalResidentialProperties:
            mlsnumber = aProperty
            try:
                residentialOldHouse = Freehold.objects.get(MLSNumber=mlsnumber)
            except Freehold.DoesNotExist:
                updateNum += 1
                for i, item in enumerate(my_list[lineIndex][0:]):
                    if not item:
                        my_list[lineIndex][i] = None

                #print(lineIndex, ' ', my_list[lineIndex])
                try:
                    newProperty = Freehold()
                    newProperty.AccessToProperty1 = my_list[lineIndex][residential_index_list[0]]
                    newProperty.AccessToProperty2 = my_list[lineIndex][residential_index_list[1]]
                    newProperty.Acreage = my_list[lineIndex][residential_index_list[2]]
                    newProperty.AddlMonthlyFees = my_list[lineIndex][residential_index_list[3]]
                    newProperty.Address = my_list[lineIndex][residential_index_list[4]]
                    newProperty.AirConditioning = my_list[lineIndex][residential_index_list[5]]
                    newProperty.AllInclusive = my_list[lineIndex][residential_index_list[6]]
                    newProperty.ApproxAge = my_list[lineIndex][residential_index_list[7]]
                    newProperty.ApproxSquareFootage = my_list[lineIndex][residential_index_list[8]]
                    newProperty.AptUnit = my_list[lineIndex][residential_index_list[9]]
                    newProperty.Area = my_list[lineIndex][residential_index_list[10]]
                    newProperty.AreaCode = my_list[lineIndex][residential_index_list[11]]
                    newProperty.Assessment = my_list[lineIndex][residential_index_list[12]]
                    newProperty.AssessmentYear = my_list[lineIndex][residential_index_list[13]]
                    newProperty.Basement1 = my_list[lineIndex][residential_index_list[14]]
                    newProperty.Basement2 = my_list[lineIndex][residential_index_list[15]]
                    newProperty.Bedrooms = my_list[lineIndex][residential_index_list[16]]
                    newProperty.BedroomsPlus = my_list[lineIndex][residential_index_list[17]]
                    newProperty.CableTVIncluded = my_list[lineIndex][residential_index_list[18]]
                    newProperty.CACIncluded = my_list[lineIndex][residential_index_list[19]]
                    newProperty.CentralVac = my_list[lineIndex][residential_index_list[20]]
                    newProperty.CommonElementsIncluded = my_list[lineIndex][residential_index_list[21]]
                    newProperty.Community = my_list[lineIndex][residential_index_list[22]]
                    newProperty.CommunityCode = my_list[lineIndex][residential_index_list[23]]
                    newProperty.DirectionsCrossStreets = my_list[lineIndex][residential_index_list[24]]
                    newProperty.DisplayAddressOnInternet = my_list[lineIndex][residential_index_list[25]]
                    newProperty.Drive = my_list[lineIndex][residential_index_list[26]]
                    newProperty.EasementsRestrictions1 = my_list[lineIndex][residential_index_list[27]]
                    newProperty.EasementsRestrictions2 = my_list[lineIndex][residential_index_list[28]]
                    newProperty.EasementsRestrictions3 = my_list[lineIndex][residential_index_list[29]]
                    newProperty.EasementsRestrictions4 = my_list[lineIndex][residential_index_list[30]]
                    newProperty.Elevator = my_list[lineIndex][residential_index_list[31]]
                    newProperty.Exterior1 = my_list[lineIndex][residential_index_list[32]]
                    newProperty.Exterior2 = my_list[lineIndex][residential_index_list[33]]
                    newProperty.Extras = my_list[lineIndex][residential_index_list[34]]
                    newProperty.FamilyRoom = my_list[lineIndex][residential_index_list[35]]
                    newProperty.FarmAgriculture = my_list[lineIndex][residential_index_list[36]]
                    newProperty.FireplaceStove = my_list[lineIndex][residential_index_list[37]]
                    newProperty.FrontingOn = my_list[lineIndex][residential_index_list[38]]
                    newProperty.Furnished = my_list[lineIndex][residential_index_list[39]]
                    newProperty.GarageSpaces = my_list[lineIndex][residential_index_list[40]]
                    newProperty.GarageType = my_list[lineIndex][residential_index_list[41]]
                    newProperty.HeatIncluded = my_list[lineIndex][residential_index_list[42]]
                    newProperty.HeatSource = my_list[lineIndex][residential_index_list[43]]
                    newProperty.HeatType = my_list[lineIndex][residential_index_list[44]]
                    newProperty.HydroIncluded = my_list[lineIndex][residential_index_list[45]]
                    newProperty.IDXUpdatedDate = my_list[lineIndex][residential_index_list[46]]
                    newProperty.Kitchens = my_list[lineIndex][residential_index_list[47]]
                    newProperty.KitchensPlus = my_list[lineIndex][residential_index_list[48]]
                    newProperty.LaundryAccess = my_list[lineIndex][residential_index_list[49]]
                    newProperty.LaundryLevel = my_list[lineIndex][residential_index_list[50]]
                    newProperty.LeaseTerm = my_list[lineIndex][residential_index_list[51]]
                    newProperty.LegalDescription = my_list[lineIndex][residential_index_list[52]]
                    newProperty.Level1 = my_list[lineIndex][residential_index_list[53]]
                    newProperty.Level10 = my_list[lineIndex][residential_index_list[54]]
                    newProperty.Level11 = my_list[lineIndex][residential_index_list[55]]
                    newProperty.Level12 = my_list[lineIndex][residential_index_list[56]]
                    newProperty.Level2 = my_list[lineIndex][residential_index_list[57]]
                    newProperty.Level3 = my_list[lineIndex][residential_index_list[58]]
                    newProperty.Level4 = my_list[lineIndex][residential_index_list[59]]
                    newProperty.Level5 = my_list[lineIndex][residential_index_list[60]]
                    newProperty.Level6 = my_list[lineIndex][residential_index_list[61]]
                    newProperty.Level7 = my_list[lineIndex][residential_index_list[62]]
                    newProperty.Level8 = my_list[lineIndex][residential_index_list[63]]
                    newProperty.Level9 = my_list[lineIndex][residential_index_list[64]]
                    newProperty.ListBrokerage = my_list[lineIndex][residential_index_list[65]]
                    newProperty.ListPrice = my_list[lineIndex][residential_index_list[66]]
                    newProperty.LotDepth = my_list[lineIndex][residential_index_list[67]]
                    newProperty.LotFront = my_list[lineIndex][residential_index_list[68]]
                    newProperty.LotIrregularities = my_list[lineIndex][residential_index_list[69]]
                    newProperty.LotSizeCode = my_list[lineIndex][residential_index_list[70]]
                    newProperty.MapNumber = my_list[lineIndex][residential_index_list[71]]
                    newProperty.MapColumn = my_list[lineIndex][residential_index_list[72]]
                    newProperty.Map = my_list[lineIndex][residential_index_list[73]]
                    newProperty.MLSNumber = my_list[lineIndex][residential_index_list[74]]
                    newProperty.Municipality = my_list[lineIndex][residential_index_list[75]]
                    newProperty.MunicipalityDistrict = my_list[lineIndex][residential_index_list[76]]
                    newProperty.MunicpCode = my_list[lineIndex][residential_index_list[77]]
                    newProperty.OtherStructures1 = my_list[lineIndex][residential_index_list[78]]
                    newProperty.OtherStructures2 = my_list[lineIndex][residential_index_list[79]]
                    newProperty.OutofAreaMunicipality = my_list[lineIndex][residential_index_list[80]]
                    newProperty.ParcelofTiedLand = my_list[lineIndex][residential_index_list[81]]
                    newProperty.ParkCostMo = my_list[lineIndex][residential_index_list[82]]
                    newProperty.ParkingIncluded = my_list[lineIndex][residential_index_list[83]]
                    newProperty.ParkingSpaces = my_list[lineIndex][residential_index_list[84]]
                    newProperty.PINNumber = my_list[lineIndex][residential_index_list[85]]
                    newProperty.PixUpdatedDate = my_list[lineIndex][residential_index_list[86]]
                    newProperty.Pool = my_list[lineIndex][residential_index_list[87]]
                    newProperty.PostalCode = my_list[lineIndex][residential_index_list[88]]
                    newProperty.PrivateEntrance = my_list[lineIndex][residential_index_list[89]]
                    newProperty.PropertyFeatures1 = my_list[lineIndex][residential_index_list[90]]
                    newProperty.PropertyFeatures2 = my_list[lineIndex][residential_index_list[91]]
                    newProperty.PropertyFeatures3 = my_list[lineIndex][residential_index_list[92]]
                    newProperty.PropertyFeatures4 = my_list[lineIndex][residential_index_list[93]]
                    newProperty.PropertyFeatures5 = my_list[lineIndex][residential_index_list[94]]
                    newProperty.PropertyFeatures6 = my_list[lineIndex][residential_index_list[95]]
                    newProperty.Province = my_list[lineIndex][residential_index_list[96]]
                    newProperty.RemarksForClients = my_list[lineIndex][residential_index_list[97]]
                    newProperty.Retirement = my_list[lineIndex][residential_index_list[98]]
                    newProperty.Room1 = my_list[lineIndex][residential_index_list[99]]
                    newProperty.Room1Desc1 = my_list[lineIndex][residential_index_list[100]]
                    newProperty.Room1Desc2 = my_list[lineIndex][residential_index_list[101]]
                    newProperty.Room1Desc3 = my_list[lineIndex][residential_index_list[102]]
                    newProperty.Room1Length = my_list[lineIndex][residential_index_list[103]]
                    newProperty.Room1Width = my_list[lineIndex][residential_index_list[104]]
                    newProperty.Room10 = my_list[lineIndex][residential_index_list[105]]
                    newProperty.Room10Desc1 = my_list[lineIndex][residential_index_list[106]]
                    newProperty.Room10Desc2 = my_list[lineIndex][residential_index_list[107]]
                    newProperty.Room10Desc3 = my_list[lineIndex][residential_index_list[108]]
                    newProperty.Room10Length = my_list[lineIndex][residential_index_list[109]]
                    newProperty.Room10Width = my_list[lineIndex][residential_index_list[110]]
                    newProperty.Room11 = my_list[lineIndex][residential_index_list[111]]
                    newProperty.Room11Desc1 = my_list[lineIndex][residential_index_list[112]]
                    newProperty.Room11Desc2 = my_list[lineIndex][residential_index_list[113]]
                    newProperty.Room11Desc3 = my_list[lineIndex][residential_index_list[114]]
                    newProperty.Room11Length = my_list[lineIndex][residential_index_list[115]]
                    newProperty.Room11Width = my_list[lineIndex][residential_index_list[116]]
                    newProperty.Room12 = my_list[lineIndex][residential_index_list[117]]
                    newProperty.Room12Desc1 = my_list[lineIndex][residential_index_list[118]]
                    newProperty.Room12Desc2 = my_list[lineIndex][residential_index_list[119]]
                    newProperty.Room12Desc3 = my_list[lineIndex][residential_index_list[120]]
                    newProperty.Room12Length = my_list[lineIndex][residential_index_list[121]]
                    newProperty.Room12Width = my_list[lineIndex][residential_index_list[122]]
                    newProperty.Room2 = my_list[lineIndex][residential_index_list[123]]
                    newProperty.Room2Desc1 = my_list[lineIndex][residential_index_list[124]]
                    newProperty.Room2Desc2 = my_list[lineIndex][residential_index_list[125]]
                    newProperty.Room2Desc3 = my_list[lineIndex][residential_index_list[126]]
                    newProperty.Room2Length = my_list[lineIndex][residential_index_list[127]]
                    newProperty.Room2Width = my_list[lineIndex][residential_index_list[128]]
                    newProperty.Room3 = my_list[lineIndex][residential_index_list[129]]
                    newProperty.Room3Desc1 = my_list[lineIndex][residential_index_list[130]]
                    newProperty.Room3Desc2 = my_list[lineIndex][residential_index_list[131]]
                    newProperty.Room3Desc3 = my_list[lineIndex][residential_index_list[132]]
                    newProperty.Room3Length = my_list[lineIndex][residential_index_list[133]]
                    newProperty.Room3Width = my_list[lineIndex][residential_index_list[134]]
                    newProperty.Room4 = my_list[lineIndex][residential_index_list[135]]
                    newProperty.Room4Desc1 = my_list[lineIndex][residential_index_list[136]]
                    newProperty.Room4Desc2 = my_list[lineIndex][residential_index_list[137]]
                    newProperty.Room4Desc3 = my_list[lineIndex][residential_index_list[138]]
                    newProperty.Room4Length = my_list[lineIndex][residential_index_list[139]]
                    newProperty.Room4Width = my_list[lineIndex][residential_index_list[140]]
                    newProperty.Room5 = my_list[lineIndex][residential_index_list[141]]
                    newProperty.Room5Desc1 = my_list[lineIndex][residential_index_list[142]]
                    newProperty.Room5Desc2 = my_list[lineIndex][residential_index_list[143]]
                    newProperty.Room5Desc3 = my_list[lineIndex][residential_index_list[144]]
                    newProperty.Room5Length = my_list[lineIndex][residential_index_list[145]]
                    newProperty.Room5Width = my_list[lineIndex][residential_index_list[146]]
                    newProperty.Room6 = my_list[lineIndex][residential_index_list[147]]
                    newProperty.Room6Desc1 = my_list[lineIndex][residential_index_list[148]]
                    newProperty.Room6Desc2 = my_list[lineIndex][residential_index_list[149]]
                    newProperty.Room6Desc3 = my_list[lineIndex][residential_index_list[150]]
                    newProperty.Room6Length = my_list[lineIndex][residential_index_list[151]]
                    newProperty.Room6Width = my_list[lineIndex][residential_index_list[152]]
                    newProperty.Room7 = my_list[lineIndex][residential_index_list[153]]
                    newProperty.Room7Desc1 = my_list[lineIndex][residential_index_list[154]]
                    newProperty.Room7Desc2 = my_list[lineIndex][residential_index_list[155]]
                    newProperty.Room7Desc3 = my_list[lineIndex][residential_index_list[156]]
                    newProperty.Room7Length = my_list[lineIndex][residential_index_list[157]]
                    newProperty.Room7Width = my_list[lineIndex][residential_index_list[158]]
                    newProperty.Room8 = my_list[lineIndex][residential_index_list[159]]
                    newProperty.Room8Desc1 = my_list[lineIndex][residential_index_list[160]]
                    newProperty.Room8Desc2 = my_list[lineIndex][residential_index_list[161]]
                    newProperty.Room8Desc3 = my_list[lineIndex][residential_index_list[162]]
                    newProperty.Room8Length = my_list[lineIndex][residential_index_list[163]]
                    newProperty.Room8Width = my_list[lineIndex][residential_index_list[164]]
                    newProperty.Room9 = my_list[lineIndex][residential_index_list[165]]
                    newProperty.Room9Desc1 = my_list[lineIndex][residential_index_list[166]]
                    newProperty.Room9Desc2 = my_list[lineIndex][residential_index_list[167]]
                    newProperty.Room9Desc3 = my_list[lineIndex][residential_index_list[168]]
                    newProperty.Room9Length = my_list[lineIndex][residential_index_list[169]]
                    newProperty.Room9Width = my_list[lineIndex][residential_index_list[170]]
                    newProperty.Rooms = my_list[lineIndex][residential_index_list[171]]
                    newProperty.RoomsPlus = my_list[lineIndex][residential_index_list[172]]
                    newProperty.RuralServices1 = my_list[lineIndex][residential_index_list[173]]
                    newProperty.RuralServices2 = my_list[lineIndex][residential_index_list[174]]
                    newProperty.RuralServices3 = my_list[lineIndex][residential_index_list[175]]
                    newProperty.RuralServices4 = my_list[lineIndex][residential_index_list[176]]
                    newProperty.RuralServices5 = my_list[lineIndex][residential_index_list[177]]
                    newProperty.SaleLease = my_list[lineIndex][residential_index_list[178]]
                    newProperty.SAlternativePower1 = my_list[lineIndex][residential_index_list[179]]
                    newProperty.SAlternativePower2 = my_list[lineIndex][residential_index_list[180]]
                    newProperty.SellerPropertyInfoStatement = my_list[lineIndex][residential_index_list[181]]
                    newProperty.Sewage1 = my_list[lineIndex][residential_index_list[182]]
                    newProperty.Sewage2 = my_list[lineIndex][residential_index_list[183]]
                    newProperty.Sewers = my_list[lineIndex][residential_index_list[184]]
                    newProperty.ShorelineAllowance = my_list[lineIndex][residential_index_list[185]]
                    newProperty.ShorelineExposure = my_list[lineIndex][residential_index_list[186]]
                    newProperty.Shoreline1 = my_list[lineIndex][residential_index_list[187]]
                    newProperty.Shoreline2 = my_list[lineIndex][residential_index_list[188]]
                    newProperty.SpecialDesignation1 = my_list[lineIndex][residential_index_list[189]]
                    newProperty.SpecialDesignation2 = my_list[lineIndex][residential_index_list[190]]
                    newProperty.SpecialDesignation3 = my_list[lineIndex][residential_index_list[191]]
                    newProperty.SpecialDesignation4 = my_list[lineIndex][residential_index_list[192]]
                    newProperty.SpecialDesignation5 = my_list[lineIndex][residential_index_list[193]]
                    newProperty.SpecialDesignation6 = my_list[lineIndex][residential_index_list[194]]
                    newProperty.Status = my_list[lineIndex][residential_index_list[195]]
                    newProperty.StreetNumber = my_list[lineIndex][residential_index_list[196]]
                    newProperty.StreetAbbreviation = my_list[lineIndex][residential_index_list[197]]
                    newProperty.StreetDirection = my_list[lineIndex][residential_index_list[198]]
                    newProperty.StreetName = my_list[lineIndex][residential_index_list[199]]
                    newProperty.Style = my_list[lineIndex][residential_index_list[200]]
                    newProperty.TaxYear = my_list[lineIndex][residential_index_list[201]]
                    newProperty.Taxes = my_list[lineIndex][residential_index_list[202]]
                    newProperty.TotalParkingSpaces = my_list[lineIndex][residential_index_list[203]]
                    newProperty.Type1 = my_list[lineIndex][residential_index_list[204]]
                    newProperty.Type2 = my_list[lineIndex][residential_index_list[205]]
                    newProperty.UFFI = my_list[lineIndex][residential_index_list[206]]
                    newProperty.UpdatedTimestamp = my_list[lineIndex][residential_index_list[207]]
                    newProperty.UtilitiesCable = my_list[lineIndex][residential_index_list[208]]
                    newProperty.UtilitiesGas = my_list[lineIndex][residential_index_list[209]]
                    newProperty.UtilitiesHydro = my_list[lineIndex][residential_index_list[210]]
                    newProperty.UtilitiesTelephone = my_list[lineIndex][residential_index_list[211]]
                    newProperty.VirtualTourUploadDate = my_list[lineIndex][residential_index_list[212]]
                    newProperty.VirtualtourURL = my_list[lineIndex][residential_index_list[213]]
                    newProperty.Washrooms = my_list[lineIndex][residential_index_list[214]]
                    newProperty.WashroomsType1 = my_list[lineIndex][residential_index_list[215]]
                    newProperty.WashroomsType1Pcs = my_list[lineIndex][residential_index_list[216]]
                    newProperty.WashroomsType1Level = my_list[lineIndex][residential_index_list[217]]
                    newProperty.WashroomsType2 = my_list[lineIndex][residential_index_list[218]]
                    newProperty.WashroomsType2Pcs = my_list[lineIndex][residential_index_list[219]]
                    newProperty.WashroomsType2Level = my_list[lineIndex][residential_index_list[220]]
                    newProperty.WashroomsType3 = my_list[lineIndex][residential_index_list[221]]
                    newProperty.WashroomsType3Pcs = my_list[lineIndex][residential_index_list[222]]
                    newProperty.WashroomsType3Level = my_list[lineIndex][residential_index_list[223]]
                    newProperty.WashroomsType4 = my_list[lineIndex][residential_index_list[224]]
                    newProperty.WashroomsType4Pcs = my_list[lineIndex][residential_index_list[225]]
                    newProperty.WashroomsType4Level = my_list[lineIndex][residential_index_list[226]]
                    newProperty.WashroomsType5 = my_list[lineIndex][residential_index_list[227]]
                    newProperty.WashroomsType5Pcs = my_list[lineIndex][residential_index_list[228]]
                    newProperty.WashroomsType5Level = my_list[lineIndex][residential_index_list[229]]
                    newProperty.Water = my_list[lineIndex][residential_index_list[230]]
                    newProperty.WaterBodyName = my_list[lineIndex][residential_index_list[231]]
                    newProperty.WaterDeliveryFeatures1 = my_list[lineIndex][residential_index_list[232]]
                    newProperty.WaterDeliveryFeatures2 = my_list[lineIndex][residential_index_list[233]]
                    newProperty.WaterFeatures1 = my_list[lineIndex][residential_index_list[234]]
                    newProperty.WaterFeatures2 = my_list[lineIndex][residential_index_list[235]]
                    newProperty.WaterFeatures3 = my_list[lineIndex][residential_index_list[236]]
                    newProperty.WaterFeatures4 = my_list[lineIndex][residential_index_list[237]]
                    newProperty.WaterFeatures5 = my_list[lineIndex][residential_index_list[238]]
                    newProperty.WaterFrontage = None #my_list[lineIndex][residential_index_list[239]]
                    newProperty.WaterIncluded = my_list[lineIndex][residential_index_list[240]]
                    newProperty.WaterSupplyTypes = my_list[lineIndex][residential_index_list[241]]
                    newProperty.WaterType = my_list[lineIndex][residential_index_list[242]]
                    newProperty.Waterfront = my_list[lineIndex][residential_index_list[243]]
                    newProperty.WaterfrontAccessoryBldgs1 = my_list[lineIndex][residential_index_list[244]]
                    newProperty.WaterfrontAccessoryBldgs2 = my_list[lineIndex][residential_index_list[245]]
                    newProperty.Zoning = my_list[lineIndex][residential_index_list[246]]

                    newProperty.save()
                    print("Residential Property Updated in Database")
                    total_residential_updated += 1
                except Exception as e:
                    total_residential_update_failed += 1
                    print(total_residential_update_failed, " Failed to Update Residential LineIndex: ", lineIndex)
                    print(e)
                    #break
            lineIndex += 1
        #print(updateNum)

        '''#fahim  end processing RESIDENTIAL  ***********'''


        '''#fahim  start processing condo  ***********'''

        urlCondo = 'http://52.60.129.77/condo_All_available.csv'
        urlCondo2 = 'http://52.60.129.77/condo_inc.txt'
        allCondoObjectsFromDB = Condo.objects.all()
        AvailableCondoMLSsFromSrever = []

        responseCondo = requests.get(urlCondo)
        print("Condo Response: ", responseCondo)
        with requests.Session() as s:
            download = s.get(urlCondo)

            decoded_content = download.content.decode('utf-8')

            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                else:
                    # print("MLS: ", row[0])
                    mlsnumber = row[0]
                    mlsnumber = mlsnumber.strip()
                    AvailableCondoMLSsFromSrever.append(mlsnumber)
        for aProperty in allCondoObjectsFromDB:
            mlsnumber = aProperty.MLSNumber
            mlsnumber = mlsnumber.strip()
            if mlsnumber not in AvailableCondoMLSsFromSrever:
                id_ = aProperty.id
                Condo.objects.filter(id=aProperty.id).delete()
                total_condo_deleted += 1
                print(total_condo_deleted, ' Condo Property Deleted with id: ', id_)
                # Condo.save()

        responseCondo2 = requests.get(urlCondo2)
        print("Condo Response2: ", responseCondo2)
        mlsindex = 0
        my_list = []
        incrementalCondoPropertiesFromServer = []
        incrementalCondoPropertiesRowArr = []
        condo_field_list = []
        with open('./templates/condo_fields.csv', mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                condo_field_list.append(row[0])
        condo_index_list = []
        with requests.Session() as s:
            download = s.get(urlCondo2)
            decoded_content = download.content.decode('utf-8')
            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                    print(row)
                    mlsindex = row.index('MLS#')
                    for i in range(0, len(row)):
                        if row[i] in condo_field_list:
                            condo_index_list.append(i)
                        else:
                            print(row[i], ' Not found')
                else:
                    # print("MLS: ", row[0])
                    mlsnumber = row[mlsindex]
                    line_count += 1
                    mlsnumber = mlsnumber.strip()
                    incrementalCondoPropertiesFromServer.append(mlsnumber)
        lineIndex = 1  # fahim
        for aProperty in incrementalCondoPropertiesFromServer:
            mlsnumber = aProperty
            try:
                residentialCondo = Condo.objects.get(MLSNumber=mlsnumber)
            except Condo.DoesNotExist:
                for i, item in enumerate(my_list[lineIndex][0:]):
                    if not item:
                        my_list[lineIndex][i] = None
                #print(lineIndex, ' ', my_list[lineIndex])
                try:
                    newProperty = Condo()

                    newProperty.Shares = my_list[lineIndex][condo_index_list[0]]
                    newProperty.AccessToProperty1 = my_list[lineIndex][condo_index_list[1]]
                    newProperty.AccessToProperty2 = my_list[lineIndex][condo_index_list[2]]
                    newProperty.Address = my_list[lineIndex][condo_index_list[3]]
                    newProperty.AirConditioning = my_list[lineIndex][condo_index_list[4]]
                    newProperty.AllInclusive = my_list[lineIndex][condo_index_list[5]]
                    newProperty.ApproxAge = my_list[lineIndex][condo_index_list[6]]
                    newProperty.ApproxSquareFootage = my_list[lineIndex][condo_index_list[7]]
                    newProperty.AptUnit = my_list[lineIndex][condo_index_list[8]]
                    newProperty.Area = my_list[lineIndex][condo_index_list[9]]
                    newProperty.AreaCode = my_list[lineIndex][condo_index_list[10]]
                    newProperty.Assessment = my_list[lineIndex][condo_index_list[11]]
                    newProperty.AssessmentYear = my_list[lineIndex][condo_index_list[12]]
                    newProperty.Basement1 = my_list[lineIndex][condo_index_list[13]]
                    newProperty.Basement2 = my_list[lineIndex][condo_index_list[14]]
                    newProperty.Bedrooms = my_list[lineIndex][condo_index_list[15]]
                    newProperty.BedroomsPlus = my_list[lineIndex][condo_index_list[16]]
                    newProperty.BuildingInsuranceIncluded = my_list[lineIndex][condo_index_list[17]]
                    newProperty.BuildingAmenities1 = my_list[lineIndex][condo_index_list[18]]
                    newProperty.BuildingAmenities2 = my_list[lineIndex][condo_index_list[19]]
                    newProperty.BuildingAmenities3 = my_list[lineIndex][condo_index_list[20]]
                    newProperty.BuildingAmenities4 = my_list[lineIndex][condo_index_list[21]]
                    newProperty.BuildingAmenities5 = my_list[lineIndex][condo_index_list[22]]
                    newProperty.BuildingAmenities6 = my_list[lineIndex][condo_index_list[23]]
                    newProperty.CableTVIncluded = my_list[lineIndex][condo_index_list[24]]
                    newProperty.CACIncluded = my_list[lineIndex][condo_index_list[25]]
                    newProperty.CentralVac = my_list[lineIndex][condo_index_list[26]]
                    newProperty.CommonElementsIncluded = my_list[lineIndex][condo_index_list[27]]
                    newProperty.Community = my_list[lineIndex][condo_index_list[28]]
                    newProperty.CommunityCode = my_list[lineIndex][condo_index_list[29]]
                    newProperty.CondoCorp = my_list[lineIndex][condo_index_list[30]]
                    newProperty.CondoRegistryOffice = my_list[lineIndex][condo_index_list[31]]
                    newProperty.CondoTaxesIncluded = my_list[lineIndex][condo_index_list[32]]
                    newProperty.DirectionsCrossStreets = my_list[lineIndex][condo_index_list[33]]
                    newProperty.DisplayAddressOnInternet = my_list[lineIndex][condo_index_list[34]]
                    newProperty.EasementsRestrictions1 = my_list[lineIndex][condo_index_list[35]]
                    newProperty.EasementsRestrictions2 = my_list[lineIndex][condo_index_list[36]]
                    newProperty.EasementsRestrictions3 = my_list[lineIndex][condo_index_list[37]]
                    newProperty.EasementsRestrictions4 = my_list[lineIndex][condo_index_list[38]]
                    newProperty.Elevator = my_list[lineIndex][condo_index_list[39]]
                    newProperty.EnsuiteLaundry = my_list[lineIndex][condo_index_list[40]]
                    newProperty.Exposure = my_list[lineIndex][condo_index_list[41]]
                    newProperty.Exterior1 = my_list[lineIndex][condo_index_list[42]]
                    newProperty.Exterior2 = my_list[lineIndex][condo_index_list[43]]
                    newProperty.Extras = my_list[lineIndex][condo_index_list[44]]
                    newProperty.FamilyRoom = my_list[lineIndex][condo_index_list[45]]
                    newProperty.FireplaceStove = my_list[lineIndex][condo_index_list[46]]
                    newProperty.Furnished = my_list[lineIndex][condo_index_list[47]]
                    newProperty.GarageType = my_list[lineIndex][condo_index_list[48]]
                    newProperty.GarageParkSpaces = my_list[lineIndex][condo_index_list[49]]
                    newProperty.HeatIncluded = my_list[lineIndex][condo_index_list[50]]
                    newProperty.HeatSource = my_list[lineIndex][condo_index_list[51]]
                    newProperty.HeatType = my_list[lineIndex][condo_index_list[52]]
                    newProperty.HydroIncluded = my_list[lineIndex][condo_index_list[53]]
                    newProperty.IDXUpdatedDate = my_list[lineIndex][condo_index_list[54]]
                    newProperty.Kitchens = my_list[lineIndex][condo_index_list[55]]
                    newProperty.KitchensPlus = my_list[lineIndex][condo_index_list[56]]
                    newProperty.LaundryAccess = my_list[lineIndex][condo_index_list[57]]
                    newProperty.LaundryLevel = my_list[lineIndex][condo_index_list[58]]
                    newProperty.LeaseTerm = my_list[lineIndex][condo_index_list[59]]
                    newProperty.Level = my_list[lineIndex][condo_index_list[60]]
                    newProperty.Level1 = my_list[lineIndex][condo_index_list[61]]
                    newProperty.Level10 = my_list[lineIndex][condo_index_list[62]]
                    newProperty.Level11 = my_list[lineIndex][condo_index_list[63]]
                    newProperty.Level12 = my_list[lineIndex][condo_index_list[64]]
                    newProperty.Level2 = my_list[lineIndex][condo_index_list[65]]
                    newProperty.Level3 = my_list[lineIndex][condo_index_list[66]]
                    newProperty.Level4 = my_list[lineIndex][condo_index_list[67]]
                    newProperty.Level5 = my_list[lineIndex][condo_index_list[68]]
                    newProperty.Level6 = my_list[lineIndex][condo_index_list[69]]
                    newProperty.Level7 = my_list[lineIndex][condo_index_list[70]]
                    newProperty.Level8 = my_list[lineIndex][condo_index_list[71]]
                    newProperty.Level9 = my_list[lineIndex][condo_index_list[72]]
                    newProperty.ListBrokerage = my_list[lineIndex][condo_index_list[73]]
                    newProperty.ListPrice = my_list[lineIndex][condo_index_list[74]]
                    newProperty.Locker = my_list[lineIndex][condo_index_list[75]]
                    newProperty.LockerNumber = my_list[lineIndex][condo_index_list[76]]
                    newProperty.LockerLevel = my_list[lineIndex][condo_index_list[77]]
                    newProperty.LockerUnit = my_list[lineIndex][condo_index_list[78]]
                    newProperty.Maintenance = my_list[lineIndex][condo_index_list[79]]
                    newProperty.MapNumber = my_list[lineIndex][condo_index_list[80]]
                    newProperty.MapColumn = my_list[lineIndex][condo_index_list[81]]
                    newProperty.MapRow = my_list[lineIndex][condo_index_list[82]]
                    newProperty.MLSNumber = my_list[lineIndex][condo_index_list[83]]
                    newProperty.Municipality = my_list[lineIndex][condo_index_list[84]]
                    newProperty.MunicipalityDistrict = my_list[lineIndex][condo_index_list[85]]
                    newProperty.MunicpCode = my_list[lineIndex][condo_index_list[86]]
                    newProperty.OutofAreaMunicipality = my_list[lineIndex][condo_index_list[87]]
                    newProperty.ParkCostMo = my_list[lineIndex][condo_index_list[88]]
                    newProperty.ParkingIncluded = my_list[lineIndex][condo_index_list[89]]
                    newProperty.ParkingLegalDescription = my_list[lineIndex][condo_index_list[90]]
                    newProperty.ParkingLegalDescription2 = my_list[lineIndex][condo_index_list[91]]
                    newProperty.ParkingSpaces = my_list[lineIndex][condo_index_list[92]]
                    newProperty.ParkingSpot1 = my_list[lineIndex][condo_index_list[93]]
                    newProperty.ParkingSpot2 = my_list[lineIndex][condo_index_list[94]]
                    newProperty.ParkingType = my_list[lineIndex][condo_index_list[95]]
                    newProperty.ParkingType2 = my_list[lineIndex][condo_index_list[96]]
                    newProperty.ParkingDrive = my_list[lineIndex][condo_index_list[97]]
                    newProperty.PetsPermitted = my_list[lineIndex][condo_index_list[98]]
                    newProperty.PINNumber = my_list[lineIndex][condo_index_list[99]]
                    newProperty.PixUpdatedDate = my_list[lineIndex][condo_index_list[100]]
                    newProperty.PostalCode = my_list[lineIndex][condo_index_list[101]]
                    newProperty.PrivateEntrance = my_list[lineIndex][condo_index_list[102]]
                    newProperty.PropertyFeatures1 = my_list[lineIndex][condo_index_list[103]]
                    newProperty.PropertyFeatures2 = my_list[lineIndex][condo_index_list[104]]
                    newProperty.PropertyFeatures3 = my_list[lineIndex][condo_index_list[105]]
                    newProperty.PropertyFeatures4 = my_list[lineIndex][condo_index_list[106]]
                    newProperty.PropertyFeatures5 = my_list[lineIndex][condo_index_list[107]]
                    newProperty.PropertyFeatures6 = my_list[lineIndex][condo_index_list[108]]
                    newProperty.Province = my_list[lineIndex][condo_index_list[109]]
                    newProperty.RemarksForClients = my_list[lineIndex][condo_index_list[110]]
                    newProperty.Retirement = my_list[lineIndex][condo_index_list[111]]
                    newProperty.Room1 = my_list[lineIndex][condo_index_list[112]]
                    newProperty.Room1Desc1 = my_list[lineIndex][condo_index_list[113]]
                    newProperty.Room1Desc2 = my_list[lineIndex][condo_index_list[114]]
                    newProperty.Room1Desc3 = my_list[lineIndex][condo_index_list[115]]
                    newProperty.Room1Length = my_list[lineIndex][condo_index_list[116]]
                    newProperty.Room1Width = my_list[lineIndex][condo_index_list[117]]
                    newProperty.Room10 = my_list[lineIndex][condo_index_list[118]]
                    newProperty.Room10Desc1 = my_list[lineIndex][condo_index_list[119]]
                    newProperty.Room10Desc2 = my_list[lineIndex][condo_index_list[120]]
                    newProperty.Room10Desc3 = my_list[lineIndex][condo_index_list[121]]
                    newProperty.Room10Length = my_list[lineIndex][condo_index_list[122]]
                    newProperty.Room10Width = my_list[lineIndex][condo_index_list[123]]
                    newProperty.Room11 = my_list[lineIndex][condo_index_list[124]]
                    newProperty.Room11Desc1 = my_list[lineIndex][condo_index_list[125]]
                    newProperty.Room11Desc2 = my_list[lineIndex][condo_index_list[126]]
                    newProperty.Room11Desc3 = my_list[lineIndex][condo_index_list[127]]
                    newProperty.Room11Length = my_list[lineIndex][condo_index_list[128]]
                    newProperty.Room11Width = my_list[lineIndex][condo_index_list[129]]
                    newProperty.Room12 = my_list[lineIndex][condo_index_list[130]]
                    newProperty.Room12Desc1 = my_list[lineIndex][condo_index_list[131]]
                    newProperty.Room12Desc2 = my_list[lineIndex][condo_index_list[132]]
                    newProperty.Room12Desc3 = my_list[lineIndex][condo_index_list[133]]
                    newProperty.Room12Length = my_list[lineIndex][condo_index_list[134]]
                    newProperty.Room12Width = my_list[lineIndex][condo_index_list[135]]
                    newProperty.Room2 = my_list[lineIndex][condo_index_list[136]]
                    newProperty.Room2Desc1 = my_list[lineIndex][condo_index_list[137]]
                    newProperty.Room2Desc2 = my_list[lineIndex][condo_index_list[138]]
                    newProperty.Room2Desc3 = my_list[lineIndex][condo_index_list[139]]
                    newProperty.Room2Length = my_list[lineIndex][condo_index_list[140]]
                    newProperty.Room2Width = my_list[lineIndex][condo_index_list[141]]
                    newProperty.Room3 = my_list[lineIndex][condo_index_list[142]]
                    newProperty.Room3Desc1 = my_list[lineIndex][condo_index_list[143]]
                    newProperty.Room3Desc2 = my_list[lineIndex][condo_index_list[144]]
                    newProperty.Room3Desc3 = my_list[lineIndex][condo_index_list[145]]
                    newProperty.Room3Length = my_list[lineIndex][condo_index_list[146]]
                    newProperty.Room3Width = my_list[lineIndex][condo_index_list[147]]
                    newProperty.Room4 = my_list[lineIndex][condo_index_list[148]]
                    newProperty.Room4Desc1 = my_list[lineIndex][condo_index_list[149]]
                    newProperty.Room4Desc2 = my_list[lineIndex][condo_index_list[150]]
                    newProperty.Room4Desc3 = my_list[lineIndex][condo_index_list[151]]
                    newProperty.Room4Length = my_list[lineIndex][condo_index_list[152]]
                    newProperty.Room4Width = my_list[lineIndex][condo_index_list[153]]
                    newProperty.Room5 = my_list[lineIndex][condo_index_list[154]]
                    newProperty.Room5Desc1 = my_list[lineIndex][condo_index_list[155]]
                    newProperty.Room5Desc2 = my_list[lineIndex][condo_index_list[156]]
                    newProperty.Room5Desc3 = my_list[lineIndex][condo_index_list[157]]
                    newProperty.Room5Length = my_list[lineIndex][condo_index_list[158]]
                    newProperty.Room5Width = my_list[lineIndex][condo_index_list[159]]
                    newProperty.Room6 = my_list[lineIndex][condo_index_list[160]]
                    newProperty.Room6Desc1 = my_list[lineIndex][condo_index_list[161]]
                    newProperty.Room6Desc2 = my_list[lineIndex][condo_index_list[162]]
                    newProperty.Room6Desc3 = my_list[lineIndex][condo_index_list[163]]
                    newProperty.Room6Length = my_list[lineIndex][condo_index_list[164]]
                    newProperty.Room6Width = my_list[lineIndex][condo_index_list[165]]
                    newProperty.Room7 = my_list[lineIndex][condo_index_list[166]]
                    newProperty.Room7Desc1 = my_list[lineIndex][condo_index_list[167]]
                    newProperty.Room7Desc2 = my_list[lineIndex][condo_index_list[168]]
                    newProperty.Room7Desc3 = my_list[lineIndex][condo_index_list[169]]
                    newProperty.Room7Length = my_list[lineIndex][condo_index_list[170]]
                    newProperty.Room7Width = my_list[lineIndex][condo_index_list[171]]
                    newProperty.Room8 = my_list[lineIndex][condo_index_list[172]]
                    newProperty.Room8Desc1 = my_list[lineIndex][condo_index_list[173]]
                    newProperty.Room8Desc2 = my_list[lineIndex][condo_index_list[174]]
                    newProperty.Room8Desc3 = my_list[lineIndex][condo_index_list[175]]
                    newProperty.Room8Length = my_list[lineIndex][condo_index_list[176]]
                    newProperty.Room8Width = my_list[lineIndex][condo_index_list[177]]
                    newProperty.Room9 = my_list[lineIndex][condo_index_list[178]]
                    newProperty.Room9Desc1 = my_list[lineIndex][condo_index_list[179]]
                    newProperty.Room9Desc2 = my_list[lineIndex][condo_index_list[180]]
                    newProperty.Room9Desc3 = my_list[lineIndex][condo_index_list[181]]
                    newProperty.Room9Length = my_list[lineIndex][condo_index_list[182]]
                    newProperty.Room9Width = my_list[lineIndex][condo_index_list[183]]
                    newProperty.Rooms = my_list[lineIndex][condo_index_list[184]]
                    newProperty.RoomsPlus = my_list[lineIndex][condo_index_list[185]]
                    newProperty.RuralServices1 = my_list[lineIndex][condo_index_list[186]]
                    newProperty.RuralServices2 = my_list[lineIndex][condo_index_list[187]]
                    newProperty.RuralServices3 = my_list[lineIndex][condo_index_list[188]]
                    newProperty.RuralServices4 = my_list[lineIndex][condo_index_list[189]]
                    newProperty.RuralServices5 = my_list[lineIndex][condo_index_list[190]]
                    newProperty.SaleLease = my_list[lineIndex][condo_index_list[191]]
                    newProperty.SAlternativePower1 = my_list[lineIndex][condo_index_list[192]]
                    newProperty.SAlternativePower2 = my_list[lineIndex][condo_index_list[193]]
                    newProperty.Sewage1 = my_list[lineIndex][condo_index_list[194]]
                    newProperty.Sewage2 = my_list[lineIndex][condo_index_list[195]]
                    newProperty.ShorelineAllowance = my_list[lineIndex][condo_index_list[196]]
                    newProperty.ShorelineExposure = my_list[lineIndex][condo_index_list[197]]
                    newProperty.Shoreline1 = my_list[lineIndex][condo_index_list[198]]
                    newProperty.Shoreline2 = my_list[lineIndex][condo_index_list[199]]
                    newProperty.SpecialDesignation1 = my_list[lineIndex][condo_index_list[200]]
                    newProperty.SpecialDesignation2 = my_list[lineIndex][condo_index_list[201]]
                    newProperty.SpecialDesignation3 = my_list[lineIndex][condo_index_list[202]]
                    newProperty.SpecialDesignation4 = my_list[lineIndex][condo_index_list[203]]
                    newProperty.SpecialDesignation5 = my_list[lineIndex][condo_index_list[204]]
                    newProperty.SpecialDesignation6 = my_list[lineIndex][condo_index_list[205]]
                    newProperty.Status = my_list[lineIndex][condo_index_list[206]]
                    newProperty.StreetNumber = my_list[lineIndex][condo_index_list[207]]
                    newProperty.StreetAbbreviation = my_list[lineIndex][condo_index_list[208]]
                    newProperty.StreetDirection = my_list[lineIndex][condo_index_list[209]]
                    newProperty.StreetName = my_list[lineIndex][condo_index_list[210]]
                    newProperty.Style = my_list[lineIndex][condo_index_list[211]]
                    newProperty.TaxYear = my_list[lineIndex][condo_index_list[212]]
                    newProperty.Taxes = my_list[lineIndex][condo_index_list[213]]
                    newProperty.TotalParkingSpaces = my_list[lineIndex][condo_index_list[214]]
                    newProperty.Type1 = my_list[lineIndex][condo_index_list[215]]
                    newProperty.Type2 = my_list[lineIndex][condo_index_list[216]]
                    newProperty.UFFI = my_list[lineIndex][condo_index_list[217]]
                    newProperty.UnitNumber = my_list[lineIndex][condo_index_list[218]]
                    newProperty.UpdatedTimestamp = my_list[lineIndex][condo_index_list[219]]
                    newProperty.VirtualTourUploadDate = my_list[lineIndex][condo_index_list[220]]
                    newProperty.VirtualtourURL = my_list[lineIndex][condo_index_list[221]]
                    newProperty.Washrooms = my_list[lineIndex][condo_index_list[222]]
                    newProperty.WashroomsType1 = my_list[lineIndex][condo_index_list[223]]
                    newProperty.WashroomsType1Pcs = my_list[lineIndex][condo_index_list[224]]
                    newProperty.WashroomsType1Level = my_list[lineIndex][condo_index_list[225]]
                    newProperty.WashroomsType2 = my_list[lineIndex][condo_index_list[226]]
                    newProperty.WashroomsType2Pcs = my_list[lineIndex][condo_index_list[227]]
                    newProperty.WashroomsType2Level = my_list[lineIndex][condo_index_list[228]]
                    newProperty.WashroomsType3 = my_list[lineIndex][condo_index_list[229]]
                    newProperty.WashroomsType3Pcs = my_list[lineIndex][condo_index_list[230]]
                    newProperty.WashroomsType3Level = my_list[lineIndex][condo_index_list[231]]
                    newProperty.WashroomsType4 = my_list[lineIndex][condo_index_list[232]]
                    newProperty.WashroomsType4Pcs = my_list[lineIndex][condo_index_list[233]]
                    newProperty.WashroomsType4Level = my_list[lineIndex][condo_index_list[234]]
                    newProperty.WashroomsType5 = my_list[lineIndex][condo_index_list[235]]
                    newProperty.WashroomsType5Pcs = my_list[lineIndex][condo_index_list[236]]
                    newProperty.WashroomsType5Level = my_list[lineIndex][condo_index_list[237]]
                    newProperty.WaterBodyName = my_list[lineIndex][condo_index_list[238]]
                    newProperty.WaterBodyType = my_list[lineIndex][condo_index_list[239]]
                    newProperty.WaterDeliveryFeatures1 = my_list[lineIndex][condo_index_list[240]]
                    newProperty.WaterDeliveryFeatures2 = my_list[lineIndex][condo_index_list[241]]
                    newProperty.WaterFeatures1 = my_list[lineIndex][condo_index_list[242]]
                    newProperty.WaterFrontage = my_list[lineIndex][condo_index_list[243]]
                    newProperty.WaterIncluded = my_list[lineIndex][condo_index_list[244]]
                    newProperty.WaterfrontAccessoryBldgs1 = my_list[lineIndex][condo_index_list[245]]
                    newProperty.WaterfrontAccessoryBldgs2 = my_list[lineIndex][condo_index_list[246]]
                    newProperty.Zoning = my_list[lineIndex][condo_index_list[247]]

                    newProperty.save()
                    print("Condo Updated in Database")
                    total_condo_updated += 1
                except Exception as e:
                    total_condo_update_failed += 1
                    print(total_condo_update_failed, " Failed to Update Condo LineIndex: ", lineIndex)
                    print(e)
                    #break
            lineIndex += 1
        '''#fahim    end processing condo  ***********'''

        #fahim start processing Commercial  ***********
        urlCommercial = 'http://52.60.129.77/commercial_All_available.csv'
        urlCommercial2 = 'http://52.60.129.77/commercial_inc.txt'
        allCommercialObjectsFromDB = Commercial.objects.all()
        AvailableCommercialMLSsFromSrever = []

        responseCommercial = requests.get(urlCommercial)
        print("Commercial Response: ", responseCommercial)
        with requests.Session() as s:
            download = s.get(urlCommercial)

            decoded_content = download.content.decode('utf-8')

            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                else:
                    mlsnumber = row[0]
                    mlsnumber = mlsnumber.strip()
                    AvailableCommercialMLSsFromSrever.append(mlsnumber)
        for aProperty in allCommercialObjectsFromDB:
            mlsnumber = aProperty.MLSNumber
            mlsnumber = mlsnumber.strip()
            if mlsnumber not in AvailableCommercialMLSsFromSrever:
                ID = aProperty.id
                Commercial.objects.filter(id=aProperty.id).delete()
                total_commercial_deleted += 1
                print(total_commercial_deleted, ' Deleted Commercial Property with id: ', ID)
                # Commercial.save()

        responseCommercial2 = requests.get(urlCommercial2)
        print("Commercial Response2: ", responseCommercial2)
        mlsindex = 0
        my_list = []
        incrementalCommercialPropertiesFromServer = []
        incrementalCommercialPropertiesRowArr = []
        commercial_field_list = []
        commercial_index_list = []
        with open('./templates/commercial_fields.csv', mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            for row in csv_reader:
                commercial_field_list.append(row[0])
        with requests.Session() as s:
            download = s.get(urlCommercial2)
            decoded_content = download.content.decode('utf-8')
            cr = csv.reader(decoded_content.splitlines(), delimiter=',')
            my_list = list(cr)
            line_count = 0
            for row in my_list:
                if line_count == 0:
                    line_count += 1
                    print(row)
                    mlsindex = row.index('MLS#')
                    for i in range(0, len(row)):
                        if row[i] in commercial_field_list:
                            commercial_index_list.append(i)
                        else:
                            print(row[i], ' Not found')
                else:
                    mlsnumber = row[mlsindex]
                    line_count += 1
                    mlsnumber = mlsnumber.strip()
                    incrementalCommercialPropertiesFromServer.append(mlsnumber)
        lineIndex = 1
        for aProperty in incrementalCommercialPropertiesFromServer:
            mlsnumber = aProperty
            try:
                residentialCommercial = Commercial.objects.get(MLSNumber=mlsnumber)
            except Commercial.DoesNotExist:
                for i, item in enumerate(my_list[lineIndex][0:]):
                    if not item :
                        #print("Line index: ", lineIndex, " col:", i)
                        my_list[lineIndex][i] = None

                #print(lineIndex, ' ', my_list[lineIndex])

                try:
                    newProperty = Commercial()

                    newProperty.TrailerParkingSpots = my_list[lineIndex][commercial_index_list[0]]
                    newProperty.BuildingPercent = my_list[lineIndex][commercial_index_list[1]]
                    newProperty.Address = my_list[lineIndex][commercial_index_list[2]]
                    newProperty.AirConditioning = my_list[lineIndex][commercial_index_list[3]]
                    newProperty.Amps = my_list[lineIndex][commercial_index_list[4]]
                    newProperty.ApproxAge = my_list[lineIndex][commercial_index_list[5]]
                    newProperty.AptUnit = my_list[lineIndex][commercial_index_list[6]]
                    newProperty.Area = my_list[lineIndex][commercial_index_list[7]]
                    newProperty.AreaCode = my_list[lineIndex][commercial_index_list[8]]
                    newProperty.AreaInfluences1 = my_list[lineIndex][commercial_index_list[9]]
                    newProperty.AreaInfluences2 = my_list[lineIndex][commercial_index_list[10]]
                    newProperty.Assessment = my_list[lineIndex][commercial_index_list[11]]
                    newProperty.AssessmentYear = my_list[lineIndex][commercial_index_list[12]]
                    newProperty.Basement1 = my_list[lineIndex][commercial_index_list[13]]
                    newProperty.BaySizeLengthFeet = my_list[lineIndex][commercial_index_list[14]]
                    newProperty.BaySizeLengthInches = my_list[lineIndex][commercial_index_list[15]]
                    newProperty.BaySizeWidthFeet = my_list[lineIndex][commercial_index_list[16]]
                    newProperty.BaySizeWidthInches = my_list[lineIndex][commercial_index_list[17]]
                    newProperty.BusinessBuildingName = my_list[lineIndex][commercial_index_list[18]]
                    newProperty.Category = my_list[lineIndex][commercial_index_list[19]]
                    newProperty.Chattels = my_list[lineIndex][commercial_index_list[20]]
                    newProperty.ClearHeightFeet = my_list[lineIndex][commercial_index_list[21]]
                    newProperty.ClearHeightInches = my_list[lineIndex][commercial_index_list[22]]
                    newProperty.CommercialCondoFees = my_list[lineIndex][commercial_index_list[23]]
                    newProperty.CommonAreaUpcharge = my_list[lineIndex][commercial_index_list[24]]
                    newProperty.Community = my_list[lineIndex][commercial_index_list[25]]
                    newProperty.CommunityCode = my_list[lineIndex][commercial_index_list[26]]
                    newProperty.Crane = my_list[lineIndex][commercial_index_list[27]]
                    newProperty.DaysOpen = my_list[lineIndex][commercial_index_list[28]]
                    newProperty.DirectionsCrossStreets = my_list[lineIndex][commercial_index_list[29]]
                    newProperty.DisplayAddressOnInternet = my_list[lineIndex][commercial_index_list[30]]
                    newProperty.DoubleManShippingDoors = my_list[lineIndex][commercial_index_list[31]]
                    newProperty.DoubleManShippingDoorsHeightFeet = my_list[lineIndex][commercial_index_list[32]]
                    newProperty.DoubleManShippingDoorsHeightInches = my_list[lineIndex][commercial_index_list[33]]
                    newProperty.DoubleManShippingDoorsWidthFeet = my_list[lineIndex][commercial_index_list[34]]
                    newProperty.DoubleManShippingDoorsWidthInches = my_list[lineIndex][commercial_index_list[35]]
                    newProperty.DriveInLevelShippingDoors = my_list[lineIndex][commercial_index_list[36]]
                    newProperty.DriveInLevelShippingDoorsHeightFeet = my_list[lineIndex][commercial_index_list[37]]
                    newProperty.DriveInLevelShippingDoorsHeightInches = my_list[lineIndex][commercial_index_list[38]]
                    newProperty.DriveInLevelShippingDoorsWidthFeet = my_list[lineIndex][commercial_index_list[39]]
                    newProperty.DriveInLevelShippingDoorsWidthInches = my_list[lineIndex][commercial_index_list[40]]
                    newProperty.Elevator = my_list[lineIndex][commercial_index_list[41]]
                    newProperty.Employees = my_list[lineIndex][commercial_index_list[42]]
                    newProperty.EstimInventoryValuesAtCost = my_list[lineIndex][commercial_index_list[43]]
                    newProperty.ExpensesActualEstimated = my_list[lineIndex][commercial_index_list[44]]
                    newProperty.Extras = my_list[lineIndex][commercial_index_list[45]]
                    newProperty.FinancialStatement = my_list[lineIndex][commercial_index_list[46]]
                    newProperty.Franchise = my_list[lineIndex][commercial_index_list[47]]
                    newProperty.Freestanding = my_list[lineIndex][commercial_index_list[48]]
                    newProperty.GarageType = my_list[lineIndex][commercial_index_list[49]]
                    newProperty.GradeLevelShippingDoors = my_list[lineIndex][commercial_index_list[50]]
                    newProperty.GradeLevelShippingDoorsHeightFeet = my_list[lineIndex][commercial_index_list[51]]
                    newProperty.GradeLevelShippingDoorsHeightInches = my_list[lineIndex][commercial_index_list[52]]
                    newProperty.GradeLevelShippingDoorsWidthFeet = my_list[lineIndex][commercial_index_list[53]]
                    newProperty.GradeLevelShippingDoorsWidthInches = my_list[lineIndex][commercial_index_list[54]]
                    newProperty.GrossIncomeSales = my_list[lineIndex][commercial_index_list[55]]
                    newProperty.HeatExpenses = my_list[lineIndex][commercial_index_list[56]]
                    newProperty.HeatType = my_list[lineIndex][commercial_index_list[57]]
                    newProperty.HoursOpen = my_list[lineIndex][commercial_index_list[58]]
                    newProperty.HydroExpense = my_list[lineIndex][commercial_index_list[59]]
                    newProperty.IDXUpdatedDate = my_list[lineIndex][commercial_index_list[60]]
                    newProperty.IndustrialArea = my_list[lineIndex][commercial_index_list[61]]
                    newProperty.IndustrialAreaCode = my_list[lineIndex][commercial_index_list[62]]
                    newProperty.InsuranceExpense = my_list[lineIndex][commercial_index_list[63]]
                    newProperty.LegalDescription = my_list[lineIndex][commercial_index_list[64]]
                    newProperty.ListBrokerage = my_list[lineIndex][commercial_index_list[65]]
                    newProperty.ListPrice = my_list[lineIndex][commercial_index_list[66]]
                    newProperty.ListPriceCode = my_list[lineIndex][commercial_index_list[67]]
                    newProperty.LLBO = my_list[lineIndex][commercial_index_list[68]]
                    newProperty.LotDepth = my_list[lineIndex][commercial_index_list[69]]
                    newProperty.LotFront = my_list[lineIndex][commercial_index_list[70]]
                    newProperty.LotIrregularities = my_list[lineIndex][commercial_index_list[71]]
                    newProperty.LotSizeCode = my_list[lineIndex][commercial_index_list[72]]
                    newProperty.LotBldgUnitCode = my_list[lineIndex][commercial_index_list[73]]
                    newProperty.Maintenance = my_list[lineIndex][commercial_index_list[74]]
                    newProperty.ManagementExpense = my_list[lineIndex][commercial_index_list[75]]
                    newProperty.Map = my_list[lineIndex][commercial_index_list[76]]
                    newProperty.MapColumn = my_list[lineIndex][commercial_index_list[77]]
                    newProperty.MapRow = my_list[lineIndex][commercial_index_list[78]]
                    newProperty.MaximumRentalTerm = my_list[lineIndex][commercial_index_list[79]]
                    newProperty.MinimumRentalTerm = my_list[lineIndex][commercial_index_list[80]]
                    newProperty.MLSNumber = my_list[lineIndex][commercial_index_list[81]]
                    newProperty.Municipality = my_list[lineIndex][commercial_index_list[82]]
                    newProperty.MunicipalityDistrict = my_list[lineIndex][commercial_index_list[83]]
                    newProperty.MunicpCode = my_list[lineIndex][commercial_index_list[84]]
                    newProperty.NetIncomeBeforeDebt = my_list[lineIndex][commercial_index_list[85]]
                    newProperty.Occupancy = my_list[lineIndex][commercial_index_list[86]]
                    newProperty.OfficeAptArea = my_list[lineIndex][commercial_index_list[87]]
                    newProperty.OfficeAptAreaCode = my_list[lineIndex][commercial_index_list[88]]
                    newProperty.OperatingExpenses = my_list[lineIndex][commercial_index_list[89]]
                    newProperty.OtherExpenses = my_list[lineIndex][commercial_index_list[90]]
                    newProperty.OutofAreaMunicipality = my_list[lineIndex][commercial_index_list[91]]
                    newProperty.OutsideStorage = my_list[lineIndex][commercial_index_list[92]]
                    newProperty.ParkingSpaces = my_list[lineIndex][commercial_index_list[93]]
                    newProperty.PercentageRent = my_list[lineIndex][commercial_index_list[94]]
                    newProperty.PINNumber = my_list[lineIndex][commercial_index_list[95]]
                    newProperty.PixUpdatedDate = my_list[lineIndex][commercial_index_list[96]]
                    newProperty.PostalCode = my_list[lineIndex][commercial_index_list[97]]
                    newProperty.Province = my_list[lineIndex][commercial_index_list[98]]
                    newProperty.Rail = my_list[lineIndex][commercial_index_list[99]]
                    newProperty.RemarksForClients = my_list[lineIndex][commercial_index_list[100]]
                    newProperty.RetailArea = my_list[lineIndex][commercial_index_list[101]]
                    newProperty.RetailAreaCode = my_list[lineIndex][commercial_index_list[102]]
                    newProperty.SaleLease = my_list[lineIndex][commercial_index_list[103]]
                    newProperty.Seats = my_list[lineIndex][commercial_index_list[104]]
                    newProperty.SellerPropertyInfoStatement = my_list[lineIndex][commercial_index_list[105]]
                    newProperty.Sewers = my_list[lineIndex][commercial_index_list[106]]
                    newProperty.SoilTest = my_list[lineIndex][commercial_index_list[107]]
                    newProperty.Sprinklers = my_list[lineIndex][commercial_index_list[108]]
                    newProperty.Status = my_list[lineIndex][commercial_index_list[109]]
                    newProperty.StreetNumber = my_list[lineIndex][commercial_index_list[110]]
                    newProperty.StreetAbbreviation = my_list[lineIndex][commercial_index_list[111]]
                    newProperty.StreetDirection = my_list[lineIndex][commercial_index_list[112]]
                    newProperty.StreetName = my_list[lineIndex][commercial_index_list[113]]
                    newProperty.Survey = my_list[lineIndex][commercial_index_list[114]]
                    newProperty.TaxYear = my_list[lineIndex][commercial_index_list[115]]
                    newProperty.Taxes = my_list[lineIndex][commercial_index_list[116]]
                    newProperty.TaxesExpense = my_list[lineIndex][commercial_index_list[117]]
                    newProperty.TotalArea = my_list[lineIndex][commercial_index_list[118]]
                    newProperty.TotalAreaCode = my_list[lineIndex][commercial_index_list[119]]
                    newProperty.TruckLevelShippingDoors = my_list[lineIndex][commercial_index_list[120]]
                    newProperty.TruckLevelShippingDoorsHeightFeet = my_list[lineIndex][commercial_index_list[121]]
                    newProperty.TruckLevelShippingDoorsHeightInches = my_list[lineIndex][commercial_index_list[122]]
                    newProperty.TruckLevelShippingDoorsWidthFeet = my_list[lineIndex][commercial_index_list[123]]
                    newProperty.TruckLevelShippingDoorsWidthInches = my_list[lineIndex][commercial_index_list[124]]
                    newProperty.Type1 = my_list[lineIndex][commercial_index_list[125]]
                    newProperty.Type2 = my_list[lineIndex][commercial_index_list[126]]
                    newProperty.TypeTaxes = my_list[lineIndex][commercial_index_list[127]]
                    newProperty.UFFI = my_list[lineIndex][commercial_index_list[128]]
                    newProperty.UpdatedTimestamp = my_list[lineIndex][commercial_index_list[129]]
                    newProperty.Use = my_list[lineIndex][commercial_index_list[130]]
                    newProperty.Utilities = my_list[lineIndex][commercial_index_list[131]]
                    newProperty.VacancyAllowance = my_list[lineIndex][commercial_index_list[132]]
                    newProperty.VirtualTourUploadDate = my_list[lineIndex][commercial_index_list[133]]
                    newProperty.VirtualTourURL = my_list[lineIndex][commercial_index_list[134]]
                    newProperty.Volts = my_list[lineIndex][commercial_index_list[135]]
                    newProperty.Washrooms = my_list[lineIndex][commercial_index_list[136]]
                    newProperty.Water = my_list[lineIndex][commercial_index_list[137]]
                    newProperty.WaterExpense = my_list[lineIndex][commercial_index_list[138]]
                    newProperty.WaterSupplyTypes = my_list[lineIndex][commercial_index_list[139]]
                    newProperty.YearExpenses = my_list[lineIndex][commercial_index_list[140]]
                    newProperty.Zoning = my_list[lineIndex][commercial_index_list[141]]

                    newProperty.save()
                    print("Commercial Property Updated in Database")
                    total_commercial_updated += 1
                except Exception as e:
                    total_commercial_update_failed += 1
                    print(total_commercial_update_failed, " Failed to Update Commercial LineIndex: ", lineIndex)
                    print(e)
                    #break
            lineIndex += 1
        #fahim end processing Commercial  ***********



        print('Total Deleted > Residential: ', total_residential_deleted, ' Condo: ', total_condo_deleted, ' Commercial: ', total_commercial_deleted)
        print('Total Updated > Residential: ', total_residential_updated, ' Condo: ', total_condo_updated, ' Commercial: ', total_commercial_updated)
        print('Total Update Failed > Residential: ', total_residential_update_failed, ' Condo: ', total_condo_update_failed, ' Commercial: ', total_commercial_update_failed)
