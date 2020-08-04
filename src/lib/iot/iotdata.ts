import AWS from 'aws-sdk';
import { IoTSubtopics } from '@tscity/shared/iot/subtopics'
// Need to use IotData to publish messages to mqtt
// - https://stackoverflow.com/a/43169834/11635178

const TS_AWS_REGION = process.env.TS_AWS_REGION;
const IOT_ENDPOINT = process.env.IOT_ENDPOINT;

export type IoTDataType = {
   subtopic?: keyof typeof IoTSubtopics;
   message: {} | string;
}

export type IoTDataArgType = IoTDataType | string

export type IoTPayloadType = IoTDataType & {
   topic: string;
}

const iotdata_client = new AWS.IotData({
   region: TS_AWS_REGION,
   apiVersion: '2015-05-28',
   endpoint: IOT_ENDPOINT,
})

const preparePayload = (topic, data: IoTDataArgType): IoTPayloadType => {
   data = typeof data === 'string'? { message: data } : data;

   const payload: IoTPayloadType = {
      topic,
      ...data,
   }

   return payload;
}

const IotData = {
   publish: async (topic, data: IoTDataArgType) => {
      const params = {
         topic,
         payload: JSON.stringify(preparePayload(topic, data)),
         qos: 1,
      }
      console.log("IoT Publishing", params);
      try {
         const result = await iotdata_client.publish(params).promise()
         console.log("INFO IotData publish result", result);
         return result;
      }
      catch (error) {
         console.log("ERROR IotData", error);
         // throw error;
      }
   }
}

Object.freeze(IotData);
export default IotData;