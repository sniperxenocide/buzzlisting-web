import os
import re
from django.shortcuts import render
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from apps.core.rbac.models import Commercial, Freehold, Condo, HouseLocation
from conf import settings
import logging
from geopy.geocoders import Nominatim, GoogleV3


class Command(BaseCommand):
    # Show this when the user types help
    help = "My test command"

    # A command must define handle()
    def handle(self, *args, **options):
        google_key = 'AIzaSyASep0oIeuNILceS-Fg3ICHYRRiCUfKnOg'

        count = 1
        geoNominatim = Nominatim(timeout=100)
        geoGoogle = GoogleV3(api_key=google_key, timeout=100)
        commercialData = Commercial.objects.all()
        for aData in commercialData:
            try:
                houseData = HouseLocation.objects.get(commercial=aData)
            except HouseLocation.DoesNotExist:
                address = aData.Address
                if address is None:
                    continue
                municipality = aData.Municipality
                city = aData.Area
                address = address + ', ' + municipality + ', ' + city
                if address is not None:
                    print(address)
                    location2 = geoGoogle.geocode(address)
                    if location2 != None:
                        latitude = location2.latitude
                        longitude = location2.longitude
                        print('GoogleV3 Successful ', count)
                        count +=1
                        HouseLocation(commercial=aData, type=3, latitude=latitude, longitude=longitude).save()

        condoData = Condo.objects.all()
        for aData in condoData:
            try:
                houseData = HouseLocation.objects.get(condo=aData)
            except HouseLocation.DoesNotExist:
                address = aData.Address
                if address is None:
                    continue
                municipality = aData.Municipality
                city = aData.Area
                address = address + ', ' + municipality + ', ' + city
                if address is not None:
                    print(address)
                    location2 = geoGoogle.geocode(address)
                    if location2 != None:
                        latitude = location2.latitude
                        longitude = location2.longitude
                        print('GoogleV3 Successful ', count)
                        count += 1
                        HouseLocation(condo=aData, type=2, latitude=latitude, longitude=longitude).save()

        resData = Freehold.objects.all()
        for aData in resData:
            try:
                houseData = HouseLocation.objects.get(freehold=aData)
            except HouseLocation.DoesNotExist:
                address = aData.Address
                if address is None:
                    continue
                municipality = aData.Municipality
                city = aData.Area
                address = address + ', ' + municipality + ', '+city
                if address is not None:
                    print(address)
                    location2 = geoGoogle.geocode(address)
                    if location2 != None:
                        latitude = location2.latitude
                        longitude = location2.longitude
                        print('GoogleV3 Successful ', count)
                        count += 1
                        HouseLocation(freehold=aData, type=1, latitude=latitude, longitude=longitude).save()
