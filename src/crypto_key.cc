#include <nan.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/crypto.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/x509.h>

NAN_METHOD(extractPublic)
{
	const auto sourceString = info[0]->ToString();
	if (!sourceString->IsOneByte()) {
		Nan::ThrowError("Malformed character found");
		return;
	}

	size_t sourceLength = sourceString->Length();
	const auto sourceBuf = new char[sourceLength];

	Nan::DecodeWrite(sourceBuf, sourceLength, sourceString);

	const auto source = BIO_new_mem_buf(sourceBuf, sourceLength);
	if (source == nullptr) {
		Nan::ThrowError("Memory allocation failed");
		delete sourceBuf;
		return;
	}

	const auto rsa = PEM_read_bio_RSAPrivateKey(source, nullptr, nullptr, nullptr);

	BIO_free(source);
	delete sourceBuf;

	if (rsa == nullptr) {
		Nan::ThrowError("Decode failed");
		return;
	}

	const auto destination = BIO_new(BIO_s_mem());
	if (destination == nullptr) {
		Nan::ThrowError("Memory allocation failed");
		return;
	}

	const auto result = PEM_write_bio_RSAPublicKey(destination, rsa);

	RSA_free(rsa);

	if (result != 1) {
		Nan::ThrowError("Public key extraction failed");
		BIO_free(destination);
		return;
	}

	char *pem;
	const auto pemLength = BIO_get_mem_data(destination, &pem);

	info.GetReturnValue().Set(Nan::Encode(pem, pemLength));
	BIO_free(destination);
}

NAN_METHOD(generate)
{
	const auto exponent = BN_new();
	const auto mem = BIO_new(BIO_s_mem());
	const auto rsa = RSA_new();
	char *data;
	long result;

	if (exponent == nullptr || mem == nullptr || rsa == nullptr) {
		Nan::ThrowError("Memory allocation failed");
		goto done;
	}

	result = BN_set_word(exponent, 65537);
	if (result != 1) {
		Nan::ThrowError("Exponent setting failed");
		goto done;
	}

	result = RSA_generate_key_ex(rsa, 2048, exponent, nullptr);
	if (result != 1) {
		Nan::ThrowError("Key generation failed");
		goto done;
	}

	result = PEM_write_bio_RSAPrivateKey(mem, rsa, NULL, NULL, 0, NULL, NULL);
	if (result != 1) {
		Nan::ThrowError("Key export failed");
		goto done;
	}

	result = BIO_get_mem_data(mem, &data);
	info.GetReturnValue().Set(Nan::Encode(data, result));

done:
	RSA_free(rsa);
	BIO_free(mem);
	BN_free(exponent);
}

NAN_MODULE_INIT(InitAll)
{
	Nan::Set(target, Nan::New<v8::String>("extractPublic").ToLocalChecked(),
		Nan::GetFunction(Nan::New<v8::FunctionTemplate>(extractPublic)).ToLocalChecked());

	Nan::Set(target, Nan::New<v8::String>("generate").ToLocalChecked(),
		Nan::GetFunction(Nan::New<v8::FunctionTemplate>(generate)).ToLocalChecked());
}

NODE_MODULE(crypto_key, InitAll);
