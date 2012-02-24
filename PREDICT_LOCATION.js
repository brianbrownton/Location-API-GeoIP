;"use strict";
var PREDICT_LOCATION = (function(window, document, undefined){

	// Add indexOf method to arrays, mainly for IE
    if( !Array.indexOf ){
        Array.prototype.indexOf = function(obj) {
			var i,
				len = this.length;
            for (i=0; i<len; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }
	
	var mod = {}, //our return object, "public" access
		geo_ip_url,
		self,
		load_flag = false,
		textad_geo, //going to store or json geo response
		output_select_ids = [],
		buildLink = function(type)
		{
			//set these 2 as variables because referencing the DOM is costly (performance) in JS
			var lh = location.href,
				lhn = location.hostname;
			
			if(lhn == "localhost" || lhn.substring(0, 3) == "192" || lhn.substring(0, 3) == "127")
			{
				//sanitize url (incase index.php was included) to find local_helper properly
				var newLoc = lh + 'local_helper.php',
					loc = lh.lastIndexOf("/");
				if( (loc-1) != lh.length)
				{
					newLoc = lh.substring( 0, (loc+1) ) + 'local_helper.php';
				}
				return newLoc;
			}
			
			if(type == 'location') return "http://"+ document.domain +"/ext_api/get_location.php";
		},
		bl = (parent.buildLink || buildLink), //if buildlink is global, prefer it
		dating = {}, //stores our matched geo/datingDB locations
		//when we can do legitimate JSONP, regions should be migrated externally
		regions = {
			"on" : "ca08", //ontario
			"az" : "us04", //arizona
			"ca" : "us06", //california
			"dc" : "us11", //district of columbia
			"fl" : "us12", //florida
			"ga" : "us13", //georgia
			"il" : "us17", //illinois
			"in" : "us18", //indiana
			"ma" : "us25", //massachusetts
			"mb" : "ca03", //manitoba
			"mi" : "us26", //michigan
			"mo" : "us29", //missouri 
			"nc" : "us37", //north carolina
			"ny" : "us36", //new york
			"ok" : "us40", //oklahoma
			"ab" : "ca01", //alberta
			"bc" : "ca02", //british columbia
			"co" : "us08", //colorado
			"ky" : "us21", //kentucky
			"md" : "us24", //maryland
			"mn" : "us27", //minnesota
			"nm" : "us35", //new mexico
			"nv" : "ca07", //nova scotia
			"oh" : "us39", //ohio
			"qc" : "ca10", //quebec
			"nj" : "us34", //new jersey
			"tx" : "us48", //texas
			"ks" : "us20", //kansas
			"pa" : "us42", //pennsylvania
			"wa" : "us53", //washington
			"va" : "us51" //virginia
		}
	
	mod.init = function(geoLoc, countryDomId, regionDomId, cityDomId){
		self = this;
		geo_ip_url 		= geoLoc		? geoLoc		: 'http://textad.xxxmatch.com/if/1/5426/0/';
		countryDomId 	= countryDomId 	? countryDomId 	: 'sel_locCountry';
		regionDomId 	= regionDomId 	? regionDomId 	: 'sel_locState';
		cityDomId 		= cityDomId 	? cityDomId 	: 'sel_locCity';
		output_select_ids = [countryDomId, regionDomId, cityDomId];
		console.log(output_select_ids)
		this.testjQuery();
	}

	mod.testjQuery = function(){
		if (typeof window.jQuery == "undefined"){
			if(!load_flag){
				load_flag = true;
				var script = document.createElement('script');
				script.setAttribute("type","text/javascript");
				script.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js");
				if (typeof script!="undefined")
					document.getElementsByTagName("head")[0].appendChild(script);
			}
			setTimeout(self.testjQuery, 100);
		} else {
			$.getScript(geo_ip_url);
		}
	}

	mod.config = function(json){
		/* TESTING */
		//json.country_code = "AU";
        //json.country_name = "Australia";
        //json.city_region = "07";
        //json.city = "Briar Hill";
        /* END TESTING */

		textad_geo = json;
		
		//use either city_region or region_name
		textad_geo.region_name = (textad_geo.region_name || textad_geo.city_region);
		
		//convert everything to lowercase for easy matching
		textad_geo.country_code = textad_geo.country_code.toLowerCase();
		textad_geo.country_name = textad_geo.country_name.toLowerCase();
		textad_geo.region_name = textad_geo.region_name.toLowerCase();
		textad_geo.city = textad_geo.city.toLowerCase();

		self.datingLocation();
	}
	
	mod.datingLocation = function(){

		var dataObj = {};
		
		dataObj.actionname = 'location';
		dataObj.sel_locCountry = (dating.country || '');
		dataObj.sel_locState = (dating.region || '');
		
		$.ajax({
			url: bl('location'),
			type: "POST",
			data: dataObj,
			dataType: "xml",
			success: this.parseLocation,
			error: function( reqObj, textStatus, errorThrown )
			{
				alert('location error: '+textStatus+ ' : ' + errorThrown);
			}
		});
	}
	
	mod.parseLocation = function(xml){
		var ind = -1,
			selector = xml.getElementsByTagName("list")[0].getAttribute("name"),
			list = [],
			val = [],
			option_list = xml.getElementsByTagName("option"),
			$option_tpl = $('<option></option>'),
			$select,
			$insert_option,
			option_value,
			i,
			len = option_list.length;
		
		//throw xml options into string array
		for(i=0; i<len; i++)
			list.push(option_list[i].childNodes[0].nodeValue.toLowerCase());
		
		if(selector==="sel_locCountry"){
			ind = list.indexOf(textad_geo.country_name);
			if(ind !== -1){
				console.log('country set - '+ind+' : '+list[ind]+'['+option_list[ind].getAttribute("value")+']');
				dating.country = option_list[ind].getAttribute("value");
			}
			else{
				//fallback, try matching based on country code
				list = [];
				for(i=0; i<len; i++)
					list.push(option_list[i].getAttribute("value").toLowerCase());
				
				ind = list.indexOf(textad_geo.country_code);
				if(ind !== -1){
					console.log('country set - '+ind+' : '+list[ind]+'['+textad_geo.country_code+'] (fallback)');
					dating.country = list[ind];
				}
				else{
					console.log('country not found in dating DB: '+textad_geo.country_name+"["+textad_geo.country_code+"]");
					return;  //couldn't find country, don't try region
				}
			}
			
			
			mod.sel_locCountry = [];
			$select = $('#'+output_select_ids[0]);

			$.each(option_list, function(inde, valu){
				option_value = valu.getAttribute("value");
				$insert_option = $option_tpl.clone().text(valu.childNodes[0].nodeValue).attr("value", option_value)
				if(option_value == dating.country)$insert_option.attr("selected", "selected");
				mod.sel_locCountry.push($insert_option);
				$select.append($insert_option);
			});

			self.datingLocation();
			return;
		}
		
		
		if(selector==="sel_locState"){
			/*we use an interface, the region object, to translate geo IP values into our database values*/
			var prop,
				interface_ind = -1,
				interface_list = [];
			for(prop in regions){
				interface_list.push(prop);
				val.push(regions[prop]);
			}
			
			interface_ind = interface_list.indexOf(textad_geo.region_name);
			if(interface_ind !== -1){
				dating.region = val[interface_ind].toUpperCase();
				
				//now find it in the xml list
				list = [];
				for(i=0; i<len; i++)
					list.push(option_list[i].getAttribute("value").toLowerCase());
				
				ind = list.indexOf(dating.region);
				console.log('region set - '+ind+' : '+interface_list[interface_ind] + '['+val[interface_ind]+']');
			}
			else{
				console.log('region not found in interface to dating DB: '+textad_geo.region_name);
				return;  //couldn't find region, don't try city
			}
			
			mod.sel_locState = [];
			$select = $('#'+output_select_ids[1]);

			$.each(option_list, function(inde, valu){
				option_value = valu.getAttribute("value");
				$insert_option = $option_tpl.clone().text(valu.childNodes[0].nodeValue).attr("value", option_value)
				if(option_value == dating.region)$insert_option.attr("selected", "selected");
				mod.sel_locState.push($insert_option);
				$select.append($insert_option);
			});
			
			self.datingLocation();
			return;
		}
		
		
		if(selector==="sel_locCity"){
			var cityFound = false,
			
			//search normally
			ind = list.indexOf(textad_geo.city);
			if(ind !== -1){
				cityFound = true;
				console.log('city set - '+ind+' : '+list[ind] + '['+option_list[ind].getAttribute("value")+']');
				dating.city = option_list[ind].getAttribute("value");
			}
			else{
				//fallback, try without spaces in city name
				var new_city = textad_geo.city.replace(/\s+/gi,""),
					new_ind = list.indexOf(new_city);
				
				if(new_ind !== -1){
					cityFound = true;
					console.log('city set - '+new_ind+' : '+list[new_ind] + '['+val[new_ind]+'] (fallback)');
					dating.city = val[new_ind];
				}
			}
			if(!cityFound){
				console.log('city not found in dating DB: '+textad_geo.city);
				return; //couldn't find city
			}
			
			mod.sel_locCity = [];
			$select = $('#'+output_select_ids[2]);

			$.each(option_list, function(inde, valu){
				option_value = valu.getAttribute("value");
				$insert_option = $option_tpl.clone().text(valu.childNodes[0].nodeValue).attr("value", option_value)
				if(option_value == dating.city)$insert_option.attr("selected", "selected");
				mod.sel_locCity.push($insert_option);
				$select.append($insert_option);
			});
		}
		
		return;
	}

	
	return mod;
}(this, document));